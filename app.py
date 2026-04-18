from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
import uuid, os, jwt, requests as http_requests, resend
from functools import wraps
from datetime import datetime, timezone, timedelta

def utcnow() -> str:
    return datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

app = Flask(__name__)
# Allow Authorization header so the frontend can send JWT tokens safely from any Vercel domain
CORS(app, 
     resources={r"/*": {"origins": "*"}},
     allow_headers=["*"])

# ==========================================
# ⚙️ MONGODB CONNECTION
# ==========================================
MONGO_URI = os.environ.get("MONGO_URI", "")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI environment variable is not set!")
client = MongoClient(MONGO_URI, maxPoolSize=50, waitQueueTimeoutMS=2500, serverSelectionTimeoutMS=10000, connectTimeoutMS=10000)
db = client['mithya_sports']
slots_collection = db['available_slots']
voice_collection = db['mithya_voice']
lost_found_collection = db['lost_and_found']
events_collection = db['mithya_events']
pyqs_collection = db['pyqs_notes']
legend_collection = db['legend_resources']
pinboard_collection = db['mithya_pinboard']
contacts_collection = db['important_contacts']
users_collection    = db['mithya_users']
app_stats_collection = db['app_stats']

# Performance Indices (Resolves query slowdowns globally)
voice_collection.create_index([("timestamp", -1)])
lost_found_collection.create_index([("timestamp", -1)])
events_collection.create_index([("date", 1)])
pyqs_collection.create_index([("timestamp", -1)])
legend_collection.create_index([("timestamp", -1)])
pinboard_collection.create_index([("timestamp", -1)])
private_deadlines_collection = db['private_deadlines']
private_deadlines_collection.create_index([("date", 1)])

# Personalized Space Collections
user_storage_collection = db['user_storage']
private_deadlines_collection = db['private_deadlines']
ur_money_collection = db['ur_money']

ADMIN_PASSWORD      = os.environ.get("ADMIN_PASSWORD") or ""
SECRET_KEY          = os.environ.get("SECRET_KEY") or ""
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET") or ""
RESEND_API_KEY      = os.environ.get("RESEND_API_KEY") or ""
ADMIN_EMAIL         = "raghavhimu@gmail.com"
SENDER_EMAIL        = "team@mithya.social"

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is not set!")
if not ADMIN_PASSWORD:
    raise RuntimeError("ADMIN_PASSWORD environment variable is not set!")

# ==========================================
# 📧 RESEND EMAIL HELPER
# ==========================================
def send_email(to: str, subject: str, html: str):
    """
    Fire-and-forget email via Resend using team@mithya.social.
    Silently fails — email failure must NEVER break the main API flow.
    """
    try:
        if not RESEND_API_KEY or not to:
            return
        resend.api_key = RESEND_API_KEY
        resend.Emails.send({
            "from": f"Mithya <{SENDER_EMAIL}>",
            "to": [to],
            "subject": subject,
            "html": html,
        })
    except Exception:
        pass  # Never crash the route for email failure

# ==========================================
# 🔐 AUTH CONFIG
# ==========================================
SUPABASE_URL     = os.environ.get("SUPABASE_URL", "")      # e.g. https://xxx.supabase.co
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")  # public anon key

import base64 as _base64

# ────────────────────────────────────────────────────────────────
# Supabase REST user-info lookup (primary — works without JWT secret)
# ────────────────────────────────────────────────────────────────
def _validate_via_supabase(token: str) -> dict | None:
    """
    Ask Supabase /auth/v1/user if the token is valid.
    Returns user dict on success, None on any failure.
    Requires SUPABASE_URL and SUPABASE_ANON_KEY env vars.
    """
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        return None
    try:
        res = http_requests.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": SUPABASE_ANON_KEY,
            },
            timeout=8,
        )
        if res.status_code == 200:
            return res.json()  # Supabase user object
    except Exception:
        pass
    return None

# ────────────────────────────────────────────────────────────────
# Local JWT decode fallback (for auth_service.py issued tokens)
# ────────────────────────────────────────────────────────────────
def _decode_local(token: str) -> dict | None:
    secrets = [SECRET_KEY]
    supabase_secret = os.environ.get("SUPABASE_JWT_SECRET", "")
    if supabase_secret:
        secrets.insert(0, supabase_secret)
        try:
            padded = supabase_secret + '=' * (-len(supabase_secret) % 4)
            secrets.insert(1, _base64.urlsafe_b64decode(padded))
        except Exception:
            pass
    for secret in secrets:
        try:
            return jwt.decode(token, secret, algorithms=["HS256"], options={"verify_aud": False})
        except jwt.ExpiredSignatureError:
            raise
        except jwt.InvalidTokenError:
            continue
    return None

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
        if not token:
            return jsonify({"success": False, "message": "Login required to do this 🔒"}), 401

        # 1️⃣ Ask Supabase REST API — most reliable, no JWT secret needed
        sb_user = _validate_via_supabase(token)
        if sb_user:
            user_meta = sb_user.get('user_metadata', {})
            request.auth_user = {
                "user_id":  sb_user.get('id') or sb_user.get('sub'),
                "email":    sb_user.get('email', ''),
                "anon_name": user_meta.get('anon_name') or "MithyaUser",
            }
            return f(*args, **kwargs)

        # 2️⃣ Fallback: decode locally (covers auth_service.py / old tokens)
        try:
            payload = _decode_local(token)
            if payload:
                user_meta = payload.get('user_metadata', {})
                request.auth_user = {
                    "user_id":  payload.get('sub') or payload.get('user_id'),
                    "email":    payload.get('email') or user_meta.get('email', ''),
                    "anon_name": user_meta.get('anon_name') or payload.get('anon_name') or "MithyaUser",
                }
                return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({"success": False, "message": "Session expired, please log in again"}), 401
        except Exception:
            pass

        return jsonify({"success": False, "message": "Login required 🔒"}), 401
    return decorated

def require_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"success": False, "message": "Admin login required"}), 401
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            if payload.get('role') != 'admin':
                return jsonify({"success": False, "message": "Access Denied: Not an admin"}), 403
            request.admin_user = payload
        except Exception as e:
            return jsonify({"success": False, "message": "Invalid admin token"}), 401
        return f(*args, **kwargs)
    return decorated

# ==========================================
# 🌐 THE PUBLIC API - LIVE SPORTS
# ==========================================
@app.route('/api/search', methods=['GET'])
def search_game():
    from datetime import timezone, timedelta
    IST = timezone(timedelta(hours=5, minutes=30))
    current_hour = datetime.now(IST).hour

    # 🌙 Updated Night Mode: API is offline only from Midnight to 4:00 AM
    if 0 <= current_hour < 4:
        return jsonify({
            "success": False,
            "message": "🌙 Slot checking service is offline for the night. Check back at 4:00 AM!"
        })

    game_query = request.args.get('game', '').lower()
    
    if not game_query:
        return jsonify({"success": False, "message": "Please enter a game name."})

    query = {"game_name": {"$regex": game_query, "$options": "i"}}
    results = list(slots_collection.find(query, {"_id": 0}))

    if results:
        return jsonify({"success": True, "data": results})
    else:
        return jsonify({"success": False, "message": f"No open slots found for '{game_query}' right now."})

# ==========================================
# 🗣️ MITVOICE FORUM ENDPOINTS 
# ==========================================
@app.route('/api/voice/posts', methods=['GET'])
def get_posts():
    try:
        posts = list(voice_collection.find({}, {"_id": 0}).sort("timestamp", -1))
        
        # Detect logged-in user to inject likedByMe / dislikedByMe flags
        current_user_id = None
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            try:
                token = auth_header.replace('Bearer ', '')
                payload = _decode_local(token)
                if payload:
                    current_user_id = payload.get('sub') or payload.get('user_id')
            except Exception:
                pass

        for post in posts:
            liked_by = post.get('liked_by') or []
            disliked_by = post.get('disliked_by') or []
            post['likedByMe'] = (current_user_id in liked_by) if current_user_id else False
            post['dislikedByMe'] = (current_user_id in disliked_by) if current_user_id else False
            # Don't expose the full arrays to the client
            post.pop('liked_by', None)
            post.pop('disliked_by', None)

        return jsonify({"success": True, "data": posts})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/voice/posts', methods=['POST'])
@require_auth
def create_post():
    try:
        data      = request.json or {}
        auth_user = request.auth_user
        text      = data.get('text', '').strip()[:2000]  # max 2000 chars
        image_url = data.get('image_url')

        if not text and not image_url:
            return jsonify({"success": False, "message": "Post must have text or an image"}), 400

        new_post = {
            "id":        str(uuid.uuid4()),
            "author":    auth_user['anon_name'],  # always from JWT, not user-supplied
            "text":      text,
            "image_url": image_url,
            "timestamp": utcnow(),
            "likes":     0,
            "dislikes":  0,
            "comments": [],
            "reported":  False
        }
        
        voice_collection.insert_one(new_post)
        
        total_posts = voice_collection.count_documents({})
        if total_posts > 50:
            excess_count = total_posts - 50
            oldest_posts = voice_collection.find({}, {"_id": 1}).sort("timestamp", 1).limit(excess_count)
            ids_to_delete = [doc["_id"] for doc in oldest_posts]
            voice_collection.delete_many({"_id": {"$in": ids_to_delete}})
            
        new_post.pop('_id', None)
        return jsonify({"success": True, "data": new_post})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/voice/posts/<post_id>/comment', methods=['POST'])
@require_auth
def add_comment(post_id):
    try:
        data      = request.json or {}
        text      = data.get('text', '').strip()[:500]  # max 500 chars per comment
        auth_user = request.auth_user  # from JWT
        user_id   = auth_user['user_id']
        anon_name = auth_user['anon_name']

        if not text:
            return jsonify({"success": False, "message": "Comment cannot be empty"}), 400

        # ── Rate limit: max 5 comments per hour ──────────────────────────────
        one_hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).strftime('%Y-%m-%dT%H:%M:%SZ')
        user_doc     = users_collection.find_one({"id": user_id})
        recent       = [t for t in (user_doc or {}).get('comment_timestamps', []) if t > one_hour_ago]
        if len(recent) >= 5:
            return jsonify({"success": False, "message": "⏰ You've hit the 5 comments/hour limit. Try again later!"}), 429
        # Keep last 20 timestamps; upsert handles missing user_doc
        updated = sorted(recent + [utcnow()])[-20:]
        users_collection.update_one(
            {"id": user_id},
            {"$set": {"comment_timestamps": updated}},
            upsert=True
        )

        new_comment = {
            "id":        str(uuid.uuid4()),
            "author":    anon_name,
            "text":      text,
            "timestamp": utcnow()
        }

        result = voice_collection.update_one(
            {"id": post_id},
            {"$push": {"comments": new_comment}}
        )
        if result.modified_count == 0:
            return jsonify({"success": False, "message": "Post not found"}), 404


        return jsonify({"success": True, "data": new_comment})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/voice/posts/<post_id>/<action>', methods=['PUT'])
def interact_post(post_id, action):
    try:
        if action not in ['like', 'dislike', 'report']:
            return jsonify({"success": False, "message": "Invalid action"}), 400

        # Get user identity — use IP as fallback for anonymous visitors
        auth_header = request.headers.get('Authorization', '')
        user_id = None
        if auth_header.startswith('Bearer '):
            try:
                token = auth_header.replace('Bearer ', '')
                payload = _decode_local(token)
                if payload:
                    user_id = payload.get('sub') or payload.get('user_id')
            except Exception:
                pass
        if not user_id:
            user_id = request.remote_addr  # Fallback: use IP address

        if action == 'report':
            result = voice_collection.update_one({"id": post_id}, {"$set": {"reported": True}})

        elif action == 'like':
            post = voice_collection.find_one({"id": post_id})
            if not post:
                return jsonify({"success": False, "message": "Post not found"}), 404
            liked_by = post.get('liked_by', [])
            disliked_by = post.get('disliked_by', [])

            if user_id in liked_by:
                # Already liked — TOGGLE it off (unlike)
                result = voice_collection.update_one(
                    {"id": post_id},
                    {"$pull": {"liked_by": user_id}, "$inc": {"likes": -1}}
                )
            else:
                # New like — add user, also remove dislike if they had one
                inc_val = {"likes": 1}
                pull_val = {"liked_by": None}  # dummy
                update = {"$addToSet": {"liked_by": user_id}, "$inc": {"likes": 1}}
                if user_id in disliked_by:
                    update["$pull"] = {"disliked_by": user_id}
                    update["$inc"]["dislikes"] = -1
                result = voice_collection.update_one({"id": post_id}, update)

        elif action == 'dislike':
            post = voice_collection.find_one({"id": post_id})
            if not post:
                return jsonify({"success": False, "message": "Post not found"}), 404
            liked_by = post.get('liked_by', [])
            disliked_by = post.get('disliked_by', [])

            if user_id in disliked_by:
                # Already disliked — TOGGLE off
                result = voice_collection.update_one(
                    {"id": post_id},
                    {"$pull": {"disliked_by": user_id}, "$inc": {"dislikes": -1}}
                )
            else:
                # New dislike
                update = {"$addToSet": {"disliked_by": user_id}, "$inc": {"dislikes": 1}}
                if user_id in liked_by:
                    update["$pull"] = {"liked_by": user_id}
                    update["$inc"]["likes"] = -1
                result = voice_collection.update_one({"id": post_id}, update)

        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})


# ==========================================
# 🧳 LOST & FOUND ENDPOINTS
# ==========================================
@app.route('/api/lostfound', methods=['GET'])
def get_lost_found_items():
    try:
        items = list(lost_found_collection.find({}, {"_id": 0}).sort("timestamp", -1))
        return jsonify({"success": True, "data": items})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/lostfound', methods=['POST'])
@require_auth
def create_lost_found_item():
    try:
        data = request.json
        if not data or not data.get('item_name') or not data.get('contact_name'):
            return jsonify({"success": False, "message": "Missing required fields"}), 400
            
        new_item = {
            "id": str(uuid.uuid4()),
            "item_name": data.get('item_name').strip(),
            "description": data.get('description', '').strip(),
            "contact_name": data.get('contact_name').strip(),
            "phone_number": data.get('phone_number').strip(),
            "type": data.get('type', 'Lost'),
            "image_url": data.get('image_url'),
            "auth_uid": request.auth_user.get('user_id'),
            "timestamp": utcnow()
        }
        
        lost_found_collection.insert_one(new_item)
        
        total_items = lost_found_collection.count_documents({})
        if total_items > 100:
            excess_count = total_items - 100
            oldest_items = lost_found_collection.find({}, {"_id": 1}).sort("timestamp", 1).limit(excess_count)
            ids_to_delete = [doc["_id"] for doc in oldest_items]
            lost_found_collection.delete_many({"_id": {"$in": ids_to_delete}})
            
        new_item.pop('_id', None)
        return jsonify({"success": True, "data": new_item})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

# ==========================================
# 🎟️ UPCOMING EVENTS ENDPOINTS
# ==========================================
@app.route('/api/lostfound/stats', methods=['GET'])
def get_lost_found_stats():
    try:
        stats = app_stats_collection.find_one({"id": "lost_found"}, {"_id": 0})
        solved_cases = stats.get('solved_cases', 0) if stats else 0
        return jsonify({"success": True, "solved_cases": solved_cases})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/lostfound/<item_id>/solve', methods=['DELETE'])
@require_auth
def solve_lost_found_item(item_id):
    try:
        user_id = request.auth_user.get('user_id')
        item = lost_found_collection.find_one({"id": item_id})
        
        if not item:
            return jsonify({"success": False, "message": "Item not found"}), 404
            
        if item.get('auth_uid') != user_id:
            return jsonify({"success": False, "message": "Unauthorized: Only the creator can resolve this"}), 403
            
        lost_found_collection.delete_one({"id": item_id})
        app_stats_collection.update_one(
            {"id": "lost_found"},
            {"$inc": {"solved_cases": 1}},
            upsert=True
        )
        return jsonify({"success": True, "message": "Marked as solved and deleted"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/admin/lostfound/<item_id>/solve', methods=['DELETE'])
@require_admin
def admin_solve_lost_found(item_id):
    try:
        item = lost_found_collection.find_one({"id": item_id})
        
        if not item:
            return jsonify({"success": False, "message": "Item not found"}), 404
            
        lost_found_collection.delete_one({"id": item_id})
        app_stats_collection.update_one(
            {"id": "lost_found"},
            {"$inc": {"solved_cases": 1}},
            upsert=True
        )
        return jsonify({"success": True, "message": "Item marked as resolved by Admin"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

# ==========================================
@app.route('/api/activities', methods=['GET'])
def get_events():
    try:
        items = list(events_collection.find({}, {"_id": 0}).sort("date", 1))
        return jsonify({"success": True, "data": items})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/activities', methods=['POST'])
def create_event():
    try:
        data = request.json
        if not data or not data.get('title') or not data.get('date'):
            return jsonify({"success": False, "message": "Missing event title or date"}), 400
            
        new_event = {
            "id": str(uuid.uuid4()),
            "title": data.get('title').strip(),
            "date": data.get('date').strip(),
            "tag": data.get('tag', 'Concert'),
            "description": data.get('description', '').strip(),
            "organizer": data.get('organizer', 'MIT-WPU').strip(),
            "icon": data.get('icon', '📅'),
            "url": data.get('url', ''),
            "image_url": data.get('image_url', ''), 
            "timestamp": utcnow()
        }
        
        events_collection.insert_one(new_event)
        new_event.pop('_id', None)
        return jsonify({"success": True, "data": new_event})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

# ==========================================
# 📚 PYQs & NOTES 
# ==========================================
@app.route('/api/pyqs', methods=['GET'])
def get_pyqs():
    try:
        query = {"is_approved": True}
        program = request.args.get('program')
        semester = request.args.get('semester')
        category = request.args.get('category')
        search = request.args.get('search', '').strip()

        if program and program != 'All':
            query['program'] = program
        if semester and semester != 'All':
            # Use regex so "3" matches notes stored as "3, 4" or "1, 3" etc.
            # \b ensures "3" doesn't accidentally match "13" or "30"
            query['semester'] = {'$regex': r'(^|,\s*)' + semester + r'(\s*,|$)', '$options': 'i'}
        if category and category != 'All':
            query['category'] = category
        if search:
            query['$or'] = [
                {'title': {'$regex': search, '$options': 'i'}},
                {'subject': {'$regex': search, '$options': 'i'}},
                {'author': {'$regex': search, '$options': 'i'}},
            ]

        approved_notes = list(pyqs_collection.find(query, {"_id": 0}).sort("timestamp", -1))
        return jsonify({"success": True, "data": approved_notes})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/pyqs', methods=['POST'])
@require_auth
def submit_pyq():
    try:
        data = request.json
        if not data or not data.get('title') or not data.get('subject'):
            return jsonify({"success": False, "message": "Missing title or subject"}), 400

        submitter_email = request.auth_user.get('email', '')
        author_name     = data.get('author', '').strip() or request.auth_user.get('anon_name', 'Anonymous Student')

        new_note = {
            "id": str(uuid.uuid4()),
            "title": data.get('title').strip(),
            "subject": data.get('subject').strip(),
            "author": author_name,
            "submitter_email": submitter_email,
            "file_url": data.get('file_url', '').strip(),
            "program": data.get('program', 'BTech').strip(),
            "semester": data.get('semester', '1').strip(),
            "category": data.get('category', 'PYQs').strip(),
            "is_approved": False,
            "stars": 0,
            "stars_log": [],
            "timestamp": utcnow()
        }

        pyqs_collection.insert_one(new_note)
        new_note.pop('_id', None)

        # Notify admin
        send_email(
            ADMIN_EMAIL,
            f"[Mithya] New Note Pending Approval: {new_note['title']}",
            f"""<div style="font-family:sans-serif;max-width:480px">
              <h2 style="color:#f59e0b">📚 New Note Submission</h2>
              <p><b>{author_name}</b> submitted a note for approval:</p>
              <table style="border-collapse:collapse;width:100%">
                <tr><td style="padding:6px;color:#888">Title</td><td style="padding:6px"><b>{new_note['title']}</b></td></tr>
                <tr><td style="padding:6px;color:#888">Subject</td><td style="padding:6px">{new_note['subject']}</td></tr>
                <tr><td style="padding:6px;color:#888">Program</td><td style="padding:6px">{new_note['program']} &mdash; Sem {new_note['semester']}</td></tr>
                <tr><td style="padding:6px;color:#888">Category</td><td style="padding:6px">{new_note['category']}</td></tr>
                <tr><td style="padding:6px;color:#888">Submitter</td><td style="padding:6px">{submitter_email}</td></tr>
              </table>
              <p style="margin-top:16px">Login to the Admin panel on Mithya to approve or reject this submission.</p>
            </div>"""
        )

        return jsonify({
            "success": True,
            "message": "Note submitted! You'll get an email once the admin reviews it.",
            "data": new_note
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})


@app.route('/api/pyqs/<note_id>/star', methods=['POST'])
@require_auth
def star_pyq(note_id):
    """Any logged-in user can give a star to a note with a mandatory reason."""
    try:
        data   = request.json or {}
        reason = data.get('reason', '').strip()
        if len(reason) < 10:
            return jsonify({"success": False, "message": "Reason must be at least 10 characters — tell us how it helped!"}), 400
        if len(reason) > 300:
            return jsonify({"success": False, "message": "Reason must be under 300 characters"}), 400

        note = pyqs_collection.find_one({"id": note_id, "is_approved": True})
        if not note:
            return jsonify({"success": False, "message": "Note not found"}), 404

        star_entry = {
            "anon_name": request.auth_user.get('anon_name', 'MithyaUser'),
            "reason":    reason,
            "timestamp": utcnow()
        }
        pyqs_collection.update_one(
            {"id": note_id},
            {"$push": {"stars_log": star_entry}, "$inc": {"stars": 1}}
        )
        return jsonify({"success": True, "message": "Star given! ⭐"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

# ==========================================
# 📌 PIN BOARD
# ==========================================
@app.route('/api/pinboard', methods=['GET'])
def get_pinboard():
    try:
        pins = list(pinboard_collection.find({}, {"_id": 0}).sort("timestamp", -1))
        return jsonify({"success": True, "data": pins})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/admin/pinboard', methods=['POST'])
@require_admin
def create_pin():
    try:
        data = request.json
        if not data or not data.get('image_url'):
            return jsonify({"success": False, "message": "Missing image url"}), 400
        new_pin = {
            "id": str(uuid.uuid4()),
            "image_url": data['image_url'],
            "caption": data.get('caption', '').strip(),
            "timestamp": utcnow()
        }
        pinboard_collection.insert_one(new_pin)
        new_pin.pop('_id', None)
        return jsonify({"success": True, "data": new_pin})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/admin/pinboard/<pin_id>', methods=['DELETE'])
@require_admin
def delete_pin(pin_id):
    try:
        result = pinboard_collection.delete_one({"id": pin_id})
        if result.deleted_count == 0:
            return jsonify({"success": False, "message": "Pin not found"}), 404
        return jsonify({"success": True, "message": "Pin deleted"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/admin/activities/<event_id>', methods=['DELETE'])
@require_admin
def delete_admin_event(event_id):
    try:
        result = events_collection.delete_one({"id": event_id})
        if result.deleted_count == 0:
            return jsonify({"success": False, "message": "Event not found"}), 404
        return jsonify({"success": True, "message": "Event deleted"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

# ==========================================
# 🔒 ADMIN SECURE ENDPOINTS 
# ==========================================
@app.route('/api/admin/verify', methods=['POST'])
def verify_admin():
    try:
        data = request.json
        username = data.get('username', '')
        password = data.get('password', '')
        
        if username == 'Himu' and password == ADMIN_PASSWORD:
            payload = {
                "user_id": "admin",
                "role": "admin",
                "exp": datetime.now(timezone.utc) + timedelta(hours=24)
            }
            token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
            return jsonify({"success": True, "message": "Access Granted", "token": token})
        else:
            return jsonify({"success": False, "message": "Invalid credentials"}), 401
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/admin/pending_pyqs', methods=['GET'])
@require_admin
def get_pending_pyqs():
    try:
        pending_notes = list(pyqs_collection.find({"is_approved": False}, {"_id": 0}).sort("timestamp", -1))
        return jsonify({"success": True, "data": pending_notes})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/admin/pyqs/<note_id>/<action>', methods=['PUT'])
@require_admin
def moderate_pyq(note_id, action):
    try:
        note = pyqs_collection.find_one({"id": note_id})
        if not note:
            return jsonify({"success": False, "message": "Note not found"}), 404

        submitter_email = note.get('submitter_email', '')
        title           = note.get('title', 'your note')

        if action == 'approve':
            result  = pyqs_collection.update_one({"id": note_id}, {"$set": {"is_approved": True}})
            message = "Note approved"
            send_email(
                submitter_email,
                "✅ Your Mithya note is live!",
                f"""<div style="font-family:sans-serif;max-width:480px">
                  <h2 style="color:#22c55e">✅ Your note is approved!</h2>
                  <p>Great news! Your note <b>'{title}'</b> has been reviewed and approved by the admin.</p>
                  <p>It is now live on <b>Mithya</b> and visible to all students. Thank you for contributing! 🌟</p>
                </div>"""
            )
        elif action == 'reject':
            result  = pyqs_collection.delete_one({"id": note_id})
            message = "Note rejected and deleted"
            send_email(
                submitter_email,
                "❌ Your Mithya note was not approved",
                f"""<div style="font-family:sans-serif;max-width:480px">
                  <h2 style="color:#ef4444">❌ Note not approved</h2>
                  <p>Unfortunately, your note <b>'{title}'</b> was not approved by the admin.</p>
                  <p>Please make sure the content is complete, relevant and properly formatted, then feel free to submit again.</p>
                </div>"""
            )
        else:
            return jsonify({"success": False, "message": "Invalid action"}), 400

        return jsonify({"success": True, "message": message})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/admin/voice/posts/<post_id>', methods=['DELETE'])
@require_admin
def admin_delete_post(post_id):
    try:
        result = voice_collection.delete_one({"id": post_id})
        if result.deleted_count == 0:
            return jsonify({"success": False, "message": "Post not found"}), 404
        return jsonify({"success": True, "message": "Post deleted completely"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/admin/voice/posts/<post_id>/comments/<comment_id>', methods=['DELETE'])
@require_admin
def admin_delete_comment(post_id, comment_id):
    try:
        result = voice_collection.update_one(
            {"id": post_id},
            {"$pull": {"comments": {"id": comment_id}}}
        )
        if result.modified_count == 0:
            return jsonify({"success": False, "message": "Comment or Post not found"}), 404
        return jsonify({"success": True, "message": "Comment deleted"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

# ==========================================
# 🏆 LEGEND RESOURCES
# ==========================================

@app.route('/api/legend', methods=['GET'])
def get_legend_resources():
    """Public: fetch all approved legend resources, sorted by stars descending."""
    try:
        items = list(legend_collection.find({"is_approved": True}, {"_id": 0}).sort("stars", -1))
        return jsonify({"success": True, "data": items})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})


@app.route('/api/legend', methods=['POST'])
@require_auth
def submit_legend_resource():
    """Auth required: Any student can submit a legend resource. Admin must approve."""
    try:
        data = request.json or {}
        title       = data.get('title', '').strip()
        drive_link  = data.get('drive_link', '').strip()
        legend_name = data.get('legend_name', '').strip()
        subject     = data.get('subject', '').strip()

        if not title or not drive_link or not legend_name or not subject:
            return jsonify({"success": False, "message": "Title, Drive link, Legend name and Subject are required"}), 400

        submitter_email = request.auth_user.get('email', '')
        submitter_name  = request.auth_user.get('anon_name', 'AnonymousUser')

        new_resource = {
            "id":               str(uuid.uuid4()),
            "title":            title,
            "drive_link":       drive_link,
            "description":      data.get('description', '').strip(),
            "legend_name":      legend_name,
            "subject":          subject,
            "program":          data.get('program', 'BTech').strip(),
            "semester":         data.get('semester', '1').strip(),
            "submitter_name":   submitter_name,
            "submitter_email":  submitter_email,
            "is_approved":      False,
            "stars":            0,
            "stars_log":        [],
            "timestamp":        utcnow()
        }

        legend_collection.insert_one(new_resource)
        new_resource.pop('_id', None)

        # Notify admin
        send_email(
            ADMIN_EMAIL,
            f"[Mithya] New Legend Resource Pending: {title}",
            f"""<div style="font-family:sans-serif;max-width:480px">
              <h2 style="color:#f59e0b">🏆 New Legend Resource Submission</h2>
              <p><b>{submitter_name}</b> submitted a Legend Resource for approval:</p>
              <table style="border-collapse:collapse;width:100%">
                <tr><td style="padding:6px;color:#888">Title</td><td style="padding:6px"><b>{title}</b></td></tr>
                <tr><td style="padding:6px;color:#888">Legend</td><td style="padding:6px">{legend_name}</td></tr>
                <tr><td style="padding:6px;color:#888">Subject</td><td style="padding:6px">{subject}</td></tr>
                <tr><td style="padding:6px;color:#888">Drive Link</td><td style="padding:6px"><a href="{drive_link}">{drive_link}</a></td></tr>
                <tr><td style="padding:6px;color:#888">Submitter</td><td style="padding:6px">{submitter_email}</td></tr>
              </table>
              <p style="margin-top:16px">Login to the Admin panel on Mithya to approve or reject.</p>
            </div>"""
        )

        return jsonify({
            "success": True,
            "message": "Legend Resource submitted! You'll be notified once it's reviewed.",
            "data":    new_resource
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})


@app.route('/api/legend/<resource_id>/star', methods=['POST'])
@require_auth
def star_legend(resource_id):
    """Any logged-in user can star a legend resource with a mandatory reason."""
    try:
        data   = request.json or {}
        reason = data.get('reason', '').strip()
        if len(reason) < 10:
            return jsonify({"success": False, "message": "Reason must be at least 10 characters — tell us how it helped!"}), 400
        if len(reason) > 300:
            return jsonify({"success": False, "message": "Reason must be under 300 characters"}), 400

        resource = legend_collection.find_one({"id": resource_id, "is_approved": True})
        if not resource:
            return jsonify({"success": False, "message": "Resource not found"}), 404

        star_entry = {
            "anon_name": request.auth_user.get('anon_name', 'MithyaUser'),
            "reason":    reason,
            "timestamp": utcnow()
        }
        legend_collection.update_one(
            {"id": resource_id},
            {"$push": {"stars_log": star_entry}, "$inc": {"stars": 1}}
        )
        return jsonify({"success": True, "message": "Star given! ⭐"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})


@app.route('/api/admin/pending_legend', methods=['GET'])
@require_admin
def get_pending_legend():
    """Admin: fetch all unapproved legend resource submissions."""
    try:
        pending = list(legend_collection.find({"is_approved": False}, {"_id": 0}).sort("timestamp", -1))
        return jsonify({"success": True, "data": pending})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})


@app.route('/api/admin/legend/<resource_id>/<action>', methods=['PUT'])
@require_admin
def moderate_legend(resource_id, action):
    """Admin: approve or reject a legend resource and notify the submitter."""
    try:
        resource = legend_collection.find_one({"id": resource_id})
        if not resource:
            return jsonify({"success": False, "message": "Resource not found"}), 404

        submitter_email = resource.get('submitter_email', '')
        title           = resource.get('title', 'your resource')

        if action == 'approve':
            legend_collection.update_one({"id": resource_id}, {"$set": {"is_approved": True}})
            message = "Legend Resource approved"
            send_email(
                submitter_email,
                "🏆 Your Legend Resource is live on Mithya!",
                f"""<div style="font-family:sans-serif;max-width:480px">
                  <h2 style="color:#f59e0b">🏆 Legend Resource Approved!</h2>
                  <p>Your submission <b>'{title}'</b> has been approved by the admin.</p>
                  <p>It is now live in the <b>Legend Resources</b> section of Mithya for all students to access. Amazing contribution! ⭐</p>
                </div>"""
            )
        elif action == 'reject':
            legend_collection.delete_one({"id": resource_id})
            message = "Legend Resource rejected and deleted"
            send_email(
                submitter_email,
                "❌ Your Legend Resource was not approved",
                f"""<div style="font-family:sans-serif;max-width:480px">
                  <h2 style="color:#ef4444">❌ Legend Resource Not Approved</h2>
                  <p>Unfortunately, your submission <b>'{title}'</b> was not approved.</p>
                  <p>Please ensure the Drive link is publicly accessible ("Anyone with link can view") and the content is high quality, then try again.</p>
                </div>"""
            )
        else:
            return jsonify({"success": False, "message": "Invalid action"}), 400

        return jsonify({"success": True, "message": message})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})


# ==========================================
# 📞 IMPORTANT CONTACTS 
# ==========================================
@app.route('/api/contacts', methods=['GET'])
def get_contacts():
    try:
        contacts = list(contacts_collection.find({}, {"_id": 0}))
        return jsonify({"success": True, "data": contacts})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/admin/contacts', methods=['POST'])
@require_admin
def create_contact():
    try:
        data = request.json
        if not data or not data.get('name') or not data.get('category'):
            return jsonify({"success": False, "message": "Missing name or category"}), 400
            
        new_contact = {
            "id": str(uuid.uuid4()),
            "name": data.get('name').strip(),
            "role": data.get('role', '').strip(),
            "department": data.get('department', '').strip(),
            "email": data.get('email', '').strip(),
            "phone": data.get('phone', '').strip(),
            "category": data.get('category').strip()
        }
        
        contacts_collection.insert_one(new_contact)
        new_contact.pop('_id', None)
        return jsonify({"success": True, "data": new_contact})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/admin/contacts/<contact_id>', methods=['DELETE'])
@require_admin
def delete_contact(contact_id):
    try:
        result = contacts_collection.delete_one({"id": contact_id})
        if result.deleted_count == 0:
            return jsonify({"success": False, "message": "Contact not found"}), 404
        return jsonify({"success": True, "message": "Contact deleted"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

# ==========================================
# 🔐 PERSONALIZED SPACE (DEADLINES & UR MONEY)
# ==========================================

@app.route('/api/private/deadlines', methods=['GET'])
@require_auth
def get_private_deadlines():
    user_id = request.auth_user.get('user_id')
    deadlines = list(private_deadlines_collection.find({"auth_uid": user_id}, {"_id": 0}).sort("date", 1))
    return jsonify({"success": True, "data": deadlines})

@app.route('/api/private/deadlines', methods=['POST'])
@require_auth
def add_private_deadline():
    try:
        data = request.json
        user_id = request.auth_user.get('user_id')
        file_size = data.get('file_size_bytes', 0) 
        
        # 1. 🛑 STRICT STORAGE LIMIT CHECK (30MB)
        storage_record = user_storage_collection.find_one({"auth_uid": user_id})
        current_used = storage_record['bytes_used'] if storage_record else 0
        
        if (current_used + file_size) > (30 * 1024 * 1024):
            # EXACT MATCH TO USER'S REQUESTED ERROR STRING
            return jsonify({"success": False, "message": "your personal data limit excedded delete previous one"}), 403
            
        # 2. Add the Deadline
        new_dl = {
            "id": str(uuid.uuid4()),
            "auth_uid": user_id,
            "title": data.get('title'),
            "type": data.get('type'),
            "date": data.get('date'),
            "file_url": data.get('file_url', ''),
            "file_size": file_size,
            "timestamp": utcnow()
        }
        private_deadlines_collection.insert_one(new_dl)
        
        # 3. Update Storage Tracker
        user_storage_collection.update_one(
            {"auth_uid": user_id}, 
            {"$inc": {"bytes_used": file_size}}, 
            upsert=True
        )
        
        new_dl.pop('_id', None)
        return jsonify({"success": True, "data": new_dl})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/private/deadlines/<dl_id>', methods=['DELETE'])
@require_auth
def delete_private_deadline(dl_id):
    user_id = request.auth_user.get('user_id')
    dl = private_deadlines_collection.find_one({"id": dl_id, "auth_uid": user_id})
    if not dl:
        return jsonify({"success": False, "message": "Not found"}), 404
        
    private_deadlines_collection.delete_one({"id": dl_id})
    
    # Subtract storage
    file_size = dl.get('file_size', 0)
    if file_size > 0:
        user_storage_collection.update_one(
            {"auth_uid": user_id},
            {"$inc": {"bytes_used": -file_size}}
        )
    return jsonify({"success": True, "message": "Deleted"})

# --- UR MONEY ENDPOINTS --- #

@app.route('/api/private/finance', methods=['GET'])
@require_auth
def get_finance():
    user_id = request.auth_user.get('user_id')
    finance = ur_money_collection.find_one({"auth_uid": user_id}, {"_id": 0})
    if not finance:
        finance = {"auth_uid": user_id, "budget": 0, "month_start": "", "expenses": []}
    return jsonify({"success": True, "data": finance})

@app.route('/api/private/finance/budget', methods=['POST'])
@require_auth
def set_budget():
    data = request.json
    user_id = request.auth_user.get('user_id')
    ur_money_collection.update_one(
        {"auth_uid": user_id},
        {"$set": {
            "budget": data.get('budget', 0),
            "month_start": data.get('month_start', '')
        }},
        upsert=True
    )
    return jsonify({"success": True, "message": "Budget set!"})

@app.route('/api/private/finance/expense', methods=['POST'])
@require_auth
def add_expense():
    data = request.json
    user_id = request.auth_user.get('user_id')
    expense = {
        "id": str(uuid.uuid4()),
        "title": data.get('title'),
        "amount": float(data.get('amount', 0)),
        "date": utcnow()
    }
    ur_money_collection.update_one(
        {"auth_uid": user_id},
        {"$push": {"expenses": {"$each": [expense], "$position": 0}}},
        upsert=True
    )
    return jsonify({"success": True, "data": expense})


if __name__ == '__main__':
    print("==========================================")
    print("   🚀 MITHYA API SERVER IS LIVE! ")
    print("==========================================")
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)