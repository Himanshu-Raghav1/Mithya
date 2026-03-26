"""
auth_service.py — Mithya Auth Proxy Service
Deploy this on a SEPARATE free Render account to bypass campus WiFi Supabase ban.
All Supabase auth calls go through here so campus network never sees supabase.co

Environment variables required on Render:
  SUPABASE_URL     — your Supabase project URL (e.g. https://xxx.supabase.co)
  SUPABASE_ANON_KEY — your Supabase anon/public key
  MONGO_URI        — MongoDB connection string (same as main app)
  SECRET_KEY       — random secret (must MATCH the one in main app.py)
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
import uuid, os, jwt, requests, re
from datetime import datetime, timezone, timedelta

app = Flask(__name__)
CORS(app)

SUPABASE_URL      = os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
MONGO_URI         = os.environ.get("MONGO_URI", "")
SECRET_KEY        = os.environ.get("SECRET_KEY", "")
TOKEN_EXPIRY_DAYS = 30

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_ANON_KEY must be set!")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI must be set!")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY must be set! Generate a strong random string.")

# MongoDB connection
client           = MongoClient(MONGO_URI)
db               = client['mithya_sports']
users_collection = db['mithya_users']

# Create unique indexes (safe to call repeatedly)
users_collection.create_index("email",     unique=True, background=True)
users_collection.create_index("anon_name", unique=True, background=True)

# Anonymous name: 3–20 chars, letters/numbers/underscores only
ANON_NAME_REGEX = re.compile(r'^[a-zA-Z0-9_]{3,20}$')

def utcnow_str():
    return datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

def make_jwt(user_doc: dict) -> str:
    payload = {
        "user_id":   user_doc["id"],
        "email":     user_doc["email"],
        "anon_name": user_doc["anon_name"],
        "exp":       datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRY_DAYS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def supabase_headers():
    return {
        "apikey":        SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type":  "application/json"
    }

# ─────────────────────────────────────────────────────────────────────────────

@app.route('/health')
def health():
    return jsonify({"ok": True, "service": "mithya-auth"})

# ─────────────────────────────────────────────────────────────────────────────

@app.route('/auth/send-otp', methods=['POST'])
def send_otp():
    """
    Step 1 of login/signup.
    Accepts: { email }
    Returns: { success, is_new, message }
    """
    try:
        data  = request.json or {}
        email = data.get('email', '').strip().lower()

        if not email.endswith('@mitwpu.edu.in'):
            return jsonify({"success": False, "message": "Only @mitwpu.edu.in emails are allowed 📧"}), 400

        # Check if user exists in our DB
        existing = users_collection.find_one({"email": email})
        is_new   = existing is None

        # Proxy OTP request to Supabase
        res = requests.post(
            f"{SUPABASE_URL}/auth/v1/otp",
            headers=supabase_headers(),
            json={"email": email, "create_user": True},
            timeout=15
        )

        if res.status_code not in (200, 204):
            err = res.json().get('msg', 'Could not send OTP')
            return jsonify({"success": False, "message": err}), 500

        return jsonify({
            "success": True,
            "is_new":  is_new,
            "message": f"OTP sent to {email} 📬"
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────

@app.route('/auth/verify-otp', methods=['POST'])
def verify_otp():
    """
    Step 2 of login/signup.
    Accepts: { email, otp, anon_name? }  (anon_name required only for new users)
    Returns: { success, token, anon_name, is_new }
    """
    try:
        data      = request.json or {}
        email     = data.get('email', '').strip().lower()
        otp       = data.get('otp', '').strip()
        anon_name = data.get('anon_name', '').strip()

        if not email or not otp:
            return jsonify({"success": False, "message": "Email and OTP required"}), 400

        # Verify OTP with Supabase
        res = requests.post(
            f"{SUPABASE_URL}/auth/v1/verify",
            headers=supabase_headers(),
            json={"email": email, "token": otp, "type": "email"},
            timeout=15
        )

        if res.status_code != 200:
            msg = res.json().get('msg', 'Invalid or expired OTP ❌')
            return jsonify({"success": False, "message": msg}), 400

        supabase_user_id = res.json().get('user', {}).get('id') or str(uuid.uuid4())

        # ── Returning user ────────────────────────────────────────────────────
        existing = users_collection.find_one({"email": email}, {"_id": 0, "comment_timestamps": 0})
        if existing:
            token = make_jwt(existing)
            return jsonify({"success": True, "token": token, "anon_name": existing["anon_name"], "is_new": False})

        # ── New user ──────────────────────────────────────────────────────────
        if not anon_name:
            return jsonify({"success": False, "message": "Choose an anonymous username to continue"}), 400

        if not ANON_NAME_REGEX.match(anon_name):
            return jsonify({"success": False, "message": "Username must be 3–20 chars, letters/numbers/_ only"}), 400

        if users_collection.find_one({"anon_name": anon_name}):
            return jsonify({"success": False, "message": "That username is taken, try another! 🎲"}), 400

        new_user = {
            "id":                 supabase_user_id,
            "email":              email,
            "anon_name":          anon_name,
            "created_at":         utcnow_str(),
            "comment_timestamps": []
        }
        users_collection.insert_one(new_user)
        new_user.pop('_id', None)

        token = make_jwt(new_user)
        return jsonify({"success": True, "token": token, "anon_name": anon_name, "is_new": True})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────

@app.route('/auth/me', methods=['GET'])
def get_me():
    """Validate JWT token and return user profile."""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"success": False, "message": "No token provided"}), 401

        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user    = users_collection.find_one(
            {"id": payload["user_id"]},
            {"_id": 0, "comment_timestamps": 0}
        )
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        return jsonify({"success": True, "data": user})

    except jwt.ExpiredSignatureError:
        return jsonify({"success": False, "message": "Session expired, please log in again"}), 401
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 401


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
