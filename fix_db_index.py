"""
One-time fix script: Drop the broken email_1 unique index from mithya_users.
Run this ONCE locally:  python fix_db_index.py
"""
from dotenv import load_dotenv
import os
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.environ.get("MONGO_URI")
if not MONGO_URI:
    print("ERROR: MONGO_URI not set in .env")
    exit(1)

client = MongoClient(MONGO_URI)
db = client['mithya_sports']
users_col = db['mithya_users']

# 1. Show existing indexes
print("Current indexes on mithya_users:")
for idx in users_col.list_indexes():
    print(" ", idx)

# 2. Drop the broken unique email index if it exists
try:
    users_col.drop_index("email_1")
    print("\n[OK] Dropped email_1 index successfully.")
except Exception as e:
    print(f"\n[SKIP] Could not drop email_1 index (may already be gone): {e}")

# 3. Remove any null-email documents that would block future operations
result = users_col.delete_many({"email": None})
print(f"[OK] Removed {result.deleted_count} null-email user documents.")

# 4. Confirm final state
print("\nFinal indexes on mithya_users:")
for idx in users_col.list_indexes():
    print(" ", idx)

print("\nDone! You can delete this script now.")
