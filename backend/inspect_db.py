import sys
import os

# Set env var for credentials path if needed
os.environ["FIREBASE_CREDENTIALS_PATH"] = "firebase-service-account.json"

from app.services.firebase_service import db, is_offline_mode

print(f"Is Offline Mode (Mock DB): {is_offline_mode}")

# Inspect users
print("\n--- USERS COLLECTION ---")
try:
    users_ref = db.collection("users")
    users = users_ref.stream()
    count = 0
    for u in users:
        print(f"User ID: {u.id} -> {u.to_dict()}")
        count += 1
    print(f"Total Users: {count}")
except Exception as e:
    print(f"Error reading users: {e}")

# Inspect posts
print("\n--- POSTS COLLECTION ---")
try:
    posts_ref = db.collection("posts")
    posts = posts_ref.stream()
    count = 0
    for p in posts:
        print(f"Post ID: {p.id} -> {p.to_dict()}")
        count += 1
    print(f"Total Posts: {count}")
except Exception as e:
    print(f"Error reading posts: {e}")
