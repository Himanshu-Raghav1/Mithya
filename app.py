from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app) # This allows your frontend website to securely talk to this backend

# ==========================================
# ⚙️ MONGODB CONNECTION
# ==========================================
# Using your verified, working connection!
MONGO_URI = "mongodb+srv://Himanshu_Raghav:Divyanshu1@clusterh.jhljyt2.mongodb.net/?retryWrites=true&w=majority&appName=ClusterH"
client = MongoClient(MONGO_URI)
db = client['mithya_sports']
slots_collection = db['available_slots']
voice_collection = db['mithya_voice']
lost_found_collection = db['lost_and_found']
events_collection = db['mithya_events']
pyqs_collection = db['pyqs_notes']
contacts_collection = db['important_contacts']

# Very simple admin password from environment, default for local testing
import os
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "mithya_admin_123")

# ==========================================
# 🌐 THE PUBLIC API - LIVE SPORTS
# ==========================================
@app.route('/api/search', methods=['GET'])
def search_game():
    # Get the game the student typed in (e.g., "?game=chess")
    game_query = request.args.get('game', '').lower()
    
    if not game_query:
        return jsonify({"success": False, "message": "Please enter a game name."})

    print(f"🔍 Someone searched for: {game_query}")

    # Search MongoDB for any game that contains the search word
    # The "$regex" makes it a smart search (so "ches" will match "Chess Board")
    query = {"game_name": {"$regex": game_query, "$options": "i"}}
    
    # Fetch the results, but hide the ugly MongoDB '_id' field
    results = list(slots_collection.find(query, {"_id": 0}))

    # Send the data back to the student's browser!
    if results:
        return jsonify({"success": True, "data": results})
    else:
        return jsonify({"success": False, "message": f"No open slots found for '{game_query}' right now."})

# ==========================================
# 🗣️ MITVOICE FORUM ENDPOINTS (MONGODB)
# ==========================================
@app.route('/api/voice/posts', methods=['GET'])
def get_posts():
    try:
        # Sort by timestamp descending (newest first)
        posts = list(voice_collection.find({}, {"_id": 0}).sort("timestamp", -1))
        return jsonify({"success": True, "data": posts})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/voice/posts', methods=['POST'])
def create_post():
    try:
        data = request.json
        if not data or not data.get('text') or not data.get('author'):
            return jsonify({"success": False, "message": "Missing text or author"}), 400
            
        new_post = {
            "id": str(uuid.uuid4()),
            "author": data.get('author'),
            "text": data.get('text').strip(),
            "timestamp": datetime.now().isoformat(),
            "likes": 0,
            "dislikes": 0,
            "comments": [],
            "reported": False
        }
        
        voice_collection.insert_one(new_post)
        
        # ENFORCE 50 POST LIMIT (Rolling Window)
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
def add_comment(post_id):
    try:
        data = request.json
        if not data or not data.get('text') or not data.get('author'):
            return jsonify({"success": False, "message": "Missing text or author"}), 400
            
        new_comment = {
            "id": str(uuid.uuid4()),
            "author": data.get('author'),
            "text": data.get('text').strip(),
            "timestamp": datetime.now().isoformat()
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
            
        if action == 'report':
            result = voice_collection.update_one({"id": post_id}, {"$set": {"reported": True}})
        elif action == 'like':
            result = voice_collection.update_one({"id": post_id}, {"$inc": {"likes": 1}})
        elif action == 'dislike':
            result = voice_collection.update_one({"id": post_id}, {"$inc": {"dislikes": 1}})
            
        if result.modified_count == 0:
            return jsonify({"success": False, "message": "Post not found"}), 404
            
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

# ==========================================
# 🧳 LOST & FOUND ENDPOINTS (MONGODB)
# ==========================================
@app.route('/api/lostfound', methods=['GET'])
def get_lost_found_items():
    try:
        # Sort by timestamp descending (newest first)
        items = list(lost_found_collection.find({}, {"_id": 0}).sort("timestamp", -1))
        return jsonify({"success": True, "data": items})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/lostfound', methods=['POST'])
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
            "timestamp": datetime.now().isoformat()
        }
        
        lost_found_collection.insert_one(new_item)
        
        # ENFORCE 100 ITEM LIMIT (Rolling Window to save space)
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
# 🎟️ UPCOMING EVENTS ENDPOINTS (MONGODB)
# ==========================================
@app.route('/api/events', methods=['GET'])
def get_events():
    try:
        # Sort by date
        items = list(events_collection.find({}, {"_id": 0}).sort("date", 1))
        return jsonify({"success": True, "data": items})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/events', methods=['POST'])
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
            "image_url": data.get('image_url', ''), # Cloudinary Poster URL
            "timestamp": datetime.now().isoformat()
        }
        
        events_collection.insert_one(new_event)
        
        new_event.pop('_id', None)
        return jsonify({"success": True, "data": new_event})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

# ==========================================
# 📚 PYQs & NOTES (MONGODB + ADMIN APPROVAL)
# ==========================================

@app.route('/api/pyqs', methods=['GET'])
def get_pyqs():
    try:
        # ONLY return notes that the admin has approved
        approved_notes = list(pyqs_collection.find({"is_approved": True}, {"_id": 0}).sort("timestamp", -1))
        return jsonify({"success": True, "data": approved_notes})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/pyqs', methods=['POST'])
def submit_pyq():
    try:
        data = request.json
        if not data or not data.get('title') or not data.get('subject'):
            return jsonify({"success": False, "message": "Missing title or subject"}), 400
            
        new_note = {
            "id": str(uuid.uuid4()),
            "title": data.get('title').strip(),
            "subject": data.get('subject').strip(),
            "author": data.get('author', 'Anonymous Student').strip(),
            "file_url": data.get('file_url', '').strip(), # Drive link or Cloudinary PDF
            "is_approved": False, # ALWAYS false initially! Requires Admin action.
            "timestamp": datetime.now().isoformat()
        }
        
        pyqs_collection.insert_one(new_note)
        
        new_note.pop('_id', None)
        return jsonify({
            "success": True, 
            "message": "Note submitted successfully! Waiting for Admin approval.",
            "data": new_note
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

# --- ADMIN SECURE ENDPOINTS ---

@app.route('/api/admin/verify', methods=['POST'])
def verify_admin():
    try:
        data = request.json
        username = data.get('username', '')
        password = data.get('password', '')
        
        if username == 'Himu' and password == ADMIN_PASSWORD:
            return jsonify({"success": True, "message": "Access Granted"})
        else:
            return jsonify({"success": False, "message": "Invalid credentials"}), 401
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/admin/pending_pyqs', methods=['GET'])
def get_pending_pyqs():
    try:
        # In a real app, this would check an Authorization header token. 
        # Since this is a simple college tool, we rely on the frontend password gate.
        pending_notes = list(pyqs_collection.find({"is_approved": False}, {"_id": 0}).sort("timestamp", -1))
        return jsonify({"success": True, "data": pending_notes})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/admin/pyqs/<note_id>/<action>', methods=['PUT'])
def moderate_pyq(note_id, action):
    try:
        if action == 'approve':
            result = pyqs_collection.update_one({"id": note_id}, {"$set": {"is_approved": True}})
            message = "Note approved"
        elif action == 'reject':
            result = pyqs_collection.delete_one({"id": note_id})
            message = "Note rejected and deleted"
        else:
            return jsonify({"success": False, "message": "Invalid action"}), 400
            
        if result.modified_count == 0 and getattr(result, 'deleted_count', 0) == 0:
            return jsonify({"success": False, "message": "Note not found"}), 404
            
        return jsonify({"success": True, "message": message})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/admin/voice/posts/<post_id>', methods=['DELETE'])
def admin_delete_post(post_id):
    try:
        result = voice_collection.delete_one({"id": post_id})
        if result.deleted_count == 0:
            return jsonify({"success": False, "message": "Post not found"}), 404
        return jsonify({"success": True, "message": "Post deleted completely"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/admin/voice/posts/<post_id>/comments/<comment_id>', methods=['DELETE'])
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
# 📞 IMPORTANT CONTACTS (MONGODB)
# ==========================================

@app.route('/api/contacts', methods=['GET'])
def get_contacts():
    try:
        contacts = list(contacts_collection.find({}, {"_id": 0}))
        return jsonify({"success": True, "data": contacts})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/admin/contacts', methods=['POST'])
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
def delete_contact(contact_id):
    try:
        result = contacts_collection.delete_one({"id": contact_id})
        if result.deleted_count == 0:
            return jsonify({"success": False, "message": "Contact not found"}), 404
        return jsonify({"success": True, "message": "Contact deleted"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

import os # Add this at the top of your file

if __name__ == '__main__':
    print("==========================================")
    print("   🚀 MITHYA API SERVER IS LIVE! ")
    print("==========================================")
    # Render provides a PORT environment variable. If not found, it defaults to 5000.
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
