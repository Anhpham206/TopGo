"""
Script seed dữ liệu test vào Firestore:
- 1 itinerary có routing data với tọa độ thực (Đà Nẵng)
- 1 post loại 'itinerary' đính kèm itinerary đó
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.firebase_service import db

# ── 1. Tạo itinerary với tọa độ thực ─────────────────────────────────────────
import json

routing_data = {
    "status": "success",
    "optimal_coordinate": {"lat": 16.0544, "lon": 108.2022},  # Trung tâm Đà Nẵng
    "total_places": 3,
    "daily_routes": [
        {
            "day": 1,
            "total_distance_km": 12.5,
            "places": [
                {"id": "bmt1", "name": "Bãi biển Mỹ Khê",      "lat": 16.0678, "lon": 108.2475},
                {"id": "bmt2", "name": "Ngũ Hành Sơn",           "lat": 15.9729, "lon": 108.2638},
                {"id": "bmt3", "name": "Bán đảo Sơn Trà",        "lat": 16.1168, "lon": 108.2777},
            ]
        },
        {
            "day": 2,
            "total_distance_km": 8.3,
            "places": [
                {"id": "bmt4", "name": "Cầu Rồng",               "lat": 16.0610, "lon": 108.2276},
                {"id": "bmt5", "name": "Bảo tàng Chăm",           "lat": 16.0622, "lon": 108.2229},
            ]
        }
    ]
}

itinerary_doc = {
    "id": "test-itinerary-danang",
    "ownerId": "test-user-seed",
    "destination": "Đà Nẵng, Việt Nam",
    "days": 2,
    "pax": 3,
    "budget": 4500000,
    "dateStart": "20/07/2026",
    "dateEnd": "21/07/2026",
    "visibility": "public",
    "itinerary": json.dumps({"output": {}, "routing": routing_data}),
    "savedAt": "2026-07-17T00:00:00Z"
}

db.collection("itineraries").document("test-itinerary-danang").set(itinerary_doc)
print("[OK] Da tao itinerary: test-itinerary-danang")

# -- 2. Tao post loai itinerary ------------------------------------------------
post_doc = {
    "id": "test-post-itinerary-1",
    "authorId": "test-user-seed",
    "authorName": "Nguyen Test",
    "authorAvatar": "https://ui-avatars.com/api/?name=Nguyen+Test&background=00a9ff&color=fff",
    "content": "Lich trinh 2 ngay Da Nang sieu dep! Ghe My Khe, Ngu Hanh Son, Son Tra va Cau Rong. Ban do ben duoi la toa do thuc tu lich trinh AI tao ra.",
    "type": "itinerary",
    "itineraryId": "test-itinerary-danang",
    "mediaUrls": [],
    "taggedLocations": ["Da Nang"],
    "likeCount": 24,
    "commentCount": 5,
    "hotScore": 80,
    "visibility": "public",
    "createdAt": "2026-07-17T08:00:00Z",
    "updatedAt": "2026-07-17T08:00:00Z",
}

db.collection("posts").document("test-post-itinerary-1").set(post_doc)
print("[OK] Da tao post: test-post-itinerary-1")

# -- 3. Verify lai -------------------------------------------------------------
post_check = db.collection("posts").document("test-post-itinerary-1").get()
itin_check = db.collection("itineraries").document("test-itinerary-danang").get()
print("Post exists:", post_check.exists)
print("Itinerary exists:", itin_check.exists)
print("")
print("Test API post: http://localhost:8000/api/posts/test-post-itinerary-1")
print("Test API itinerary: http://localhost:8000/api/itineraries/test-itinerary-danang")
print("Seed xong!")
