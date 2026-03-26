"""
auth_service.py — Mithya Auth Proxy Service
Deploy this on a SEPARATE free Render account to bypass campus WiFi Supabase ban.

All user auth data (email, anon_name) is stored in the Supabase `profiles` table.
MongoDB is NOT used here at all — Supabase handles everything auth-related.

Environment variables required on Render:
  SUPABASE_URL      — your Supabase project URL (e.g. https://xxx.supabase.co)
  SUPABASE_ANON_KEY — your Supabase anon/public key
  SECRET_KEY        — random secret string (must MATCH the one in main app.py)
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import uuid, os, jwt, requests, re
from datetime import datetime, timezone, timedelta

app = Flask(__name__)
CORS(app)

SUPABASE_URL      = os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
SECRET_KEY        = os.environ.get("SECRET_KEY", "")
TOKEN_EXPIRY_DAYS = 30

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_ANON_KEY must be set!")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY must be set! Generate a strong random string.")

# Anonymous name: 3–20 chars, letters/numbers/underscores only
ANON_NAME_REGEX = re.compile(r'^[a-zA-Z0-9_]{3,20}$')

# ─────────────────────────────────────────────────────────────────────────────
# Supabase Auth API helpers (for OTP)
# ─────────────────────────────────────────────────────────────────────────────

def supabase_auth_headers():
    return {
        "apikey":        SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type":  "application/json"
    }

# ─────────────────────────────────────────────────────────────────────────────
# Supabase Database (REST) helpers — profiles table
# ─────────────────────────────────────────────────────────────────────────────

def supabase_db_headers():
    return {
        "apikey":        SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type":  "application/json",
        "Prefer":        "return=representation"
    }

PROFILES_URL = lambda: f"{SUPABASE_URL}/rest/v1/profiles"

def get_profile_by_email(email: str):
    """Look up a user profile from Supabase by email."""
    res = requests.get(
        PROFILES_URL(),
        headers=supabase_db_headers(),
        params={"email": f"eq.{email}", "select": "*"},
        timeout=10
    )
    data = res.json()
    return data[0] if isinstance(data, list) and data else None

def get_profile_by_anon_name(anon_name: str):
    """Check if an anonymous username is already taken."""
    res = requests.get(
        PROFILES_URL(),
        headers=supabase_db_headers(),
        params={"anon_name": f"eq.{anon_name}", "select": "id"},
        timeout=10
    )
    data = res.json()
    return data[0] if isinstance(data, list) and data else None

def create_profile(user_id: str, email: str, anon_name: str):
    """Insert a new user profile into the Supabase profiles table."""
    res = requests.post(
        PROFILES_URL(),
        headers=supabase_db_headers(),
        json={
            "id":        user_id,
            "email":     email,
            "anon_name": anon_name,
        },
        timeout=10
    )
    if res.status_code == 201:
        data = res.json()
        return data[0] if isinstance(data, list) else data
    return None

# ─────────────────────────────────────────────────────────────────────────────

def make_jwt(user_id: str, email: str, anon_name: str) -> str:
    payload = {
        "user_id":   user_id,
        "email":     email,
        "anon_name": anon_name,
        "exp":       datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRY_DAYS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

# ─────────────────────────────────────────────────────────────────────────────

@app.route('/health')
def health():
    return jsonify({"ok": True, "service": "mithya-auth"})

# ─────────────────────────────────────────────────────────────────────────────

@app.route('/auth/send-otp', methods=['POST'])
def send_otp():
    """
    Step 1: Validate MIT email, check if new/returning, send OTP via Supabase.
    Accepts: { email }
    Returns: { success, is_new, message }
    """
    try:
        data  = request.json or {}
        email = data.get('email', '').strip().lower()

        if not email.endswith('@mitwpu.edu.in'):
            return jsonify({"success": False, "message": "Only @mitwpu.edu.in emails are allowed 📧"}), 400

        # Check Supabase profiles table to determine if new/returning user
        existing_profile = get_profile_by_email(email)
        is_new = existing_profile is None

        # Send OTP via Supabase auth (proxied to bypass campus ban)
        res = requests.post(
            f"{SUPABASE_URL}/auth/v1/otp",
            headers=supabase_auth_headers(),
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
    Step 2: Verify OTP with Supabase. For new users, create a profile in Supabase DB.
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

        # Verify OTP with Supabase auth API
        res = requests.post(
            f"{SUPABASE_URL}/auth/v1/verify",
            headers=supabase_auth_headers(),
            json={"email": email, "token": otp, "type": "email"},
            timeout=15
        )

        if res.status_code != 200:
            msg = res.json().get('msg', 'Invalid or expired OTP ❌')
            return jsonify({"success": False, "message": msg}), 400

        # Get the Supabase user ID from the response
        supabase_user_id = res.json().get('user', {}).get('id') or str(uuid.uuid4())

        # ── Returning user: look up profile from Supabase ─────────────────────
        existing = get_profile_by_email(email)
        if existing:
            token = make_jwt(existing["id"], existing["email"], existing["anon_name"])
            return jsonify({
                "success":   True,
                "token":     token,
                "anon_name": existing["anon_name"],
                "is_new":    False
            })

        # ── New user: validate anon_name and create profile in Supabase ────────
        if not anon_name:
            return jsonify({"success": False, "message": "Choose an anonymous username to continue"}), 400

        if not ANON_NAME_REGEX.match(anon_name):
            return jsonify({"success": False, "message": "Username must be 3–20 chars, letters/numbers/_ only"}), 400

        if get_profile_by_anon_name(anon_name):
            return jsonify({"success": False, "message": "That username is taken, try another! 🎲"}), 400

        # Save profile to Supabase profiles table
        profile = create_profile(supabase_user_id, email, anon_name)
        if not profile:
            return jsonify({"success": False, "message": "Failed to save profile. Try again."}), 500

        token = make_jwt(supabase_user_id, email, anon_name)
        return jsonify({
            "success":   True,
            "token":     token,
            "anon_name": anon_name,
            "is_new":    True
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────

@app.route('/auth/me', methods=['GET'])
def get_me():
    """Validate JWT token, fetch fresh profile from Supabase DB."""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"success": False, "message": "No token provided"}), 401

        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])

        # Fetch live profile from Supabase (in case anon_name ever changes)
        profile = get_profile_by_email(payload["email"])
        if not profile:
            return jsonify({"success": False, "message": "Profile not found"}), 404

        return jsonify({"success": True, "data": {
            "user_id":   profile["id"],
            "email":     profile["email"],
            "anon_name": profile["anon_name"]
        }})

    except jwt.ExpiredSignatureError:
        return jsonify({"success": False, "message": "Session expired, please log in again"}), 401
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 401


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
