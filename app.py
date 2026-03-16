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

import os # Add this at the top of your file

if __name__ == '__main__':
    print("==========================================")
    print("   🚀 MITHYA API SERVER IS LIVE! ")
    print("==========================================")
    # Render provides a PORT environment variable. If not found, it defaults to 5000.
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
