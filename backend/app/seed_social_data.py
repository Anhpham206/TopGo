"""
Script seed dữ liệu mẫu cho tính năng mạng xã hội vào local_db.json.
Chạy 1 lần để tạo mock data cho offline development.

Usage: python -m app.seed_social_data
"""

import json
import os
import datetime

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCAL_DB_PATH = os.path.join(BACKEND_DIR, "local_db.json")

def seed():
    # Load existing data
    with open(LOCAL_DB_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    now = datetime.datetime.now(datetime.timezone.utc)

    # ── Users ──
    users = {
        "users/user_travel_blogger": {
            "uid": "user_travel_blogger",
            "displayName": "Minh Travel",
            "photoUrl": "",
            "followerCount": 1250,
            "followingCount": 85
        },
        "users/user_foodie": {
            "uid": "user_foodie",
            "displayName": "Foodie Sài Gòn",
            "photoUrl": "",
            "followerCount": 890,
            "followingCount": 120
        },
        "users/user_adventure": {
            "uid": "user_adventure",
            "displayName": "Hiker Việt Nam",
            "photoUrl": "",
            "followerCount": 2100,
            "followingCount": 45
        },
        "users/user_couple": {
            "uid": "user_couple",
            "displayName": "Couple Du Lịch",
            "photoUrl": "",
            "followerCount": 670,
            "followingCount": 200
        },
        "users/user_budget": {
            "uid": "user_budget",
            "displayName": "Du Lịch Tiết Kiệm",
            "photoUrl": "",
            "followerCount": 450,
            "followingCount": 95
        },
        "users/user_solo": {
            "uid": "user_solo",
            "displayName": "Solo Backpacker",
            "photoUrl": "",
            "followerCount": 780,
            "followingCount": 150
        }
    }

    # ── Follows (local_offline_user follows some users) ──
    follows = {
        "follows/local_offline_user_user_travel_blogger": {
            "id": "local_offline_user_user_travel_blogger",
            "followerId": "local_offline_user",
            "followingId": "user_travel_blogger",
            "createdAt": (now - datetime.timedelta(days=30)).isoformat()
        },
        "follows/local_offline_user_user_foodie": {
            "id": "local_offline_user_user_foodie",
            "followerId": "local_offline_user",
            "followingId": "user_foodie",
            "createdAt": (now - datetime.timedelta(days=25)).isoformat()
        },
        "follows/local_offline_user_user_adventure": {
            "id": "local_offline_user_user_adventure",
            "followerId": "local_offline_user",
            "followingId": "user_adventure",
            "createdAt": (now - datetime.timedelta(days=20)).isoformat()
        }
    }

    # ── Itineraries (public, for embedding in posts) ──
    itineraries = {
        "itineraries/itin-phuquoc-3d": {
            "id": "itin-phuquoc-3d",
            "ownerId": "user_foodie",
            "visibility": "public",
            "clonedFrom": None,
            "destination": "Phú Quốc",
            "days": 3,
            "budget": 5500000,
            "dateStart": "2026-07-01",
            "dateEnd": "2026-07-03",
            "createdAt": (now - datetime.timedelta(hours=6)).isoformat()
        },
        "itineraries/itin-hanoi-5d": {
            "id": "itin-hanoi-5d",
            "ownerId": "user_budget",
            "visibility": "public",
            "clonedFrom": None,
            "destination": "Hà Nội",
            "days": 5,
            "budget": 3000000,
            "dateStart": "2026-07-10",
            "dateEnd": "2026-07-14",
            "createdAt": (now - datetime.timedelta(hours=13)).isoformat()
        }
    }

    # ── Posts ──
    posts = {
        "posts/post-001": {
            "id": "post-001",
            "authorId": "user_travel_blogger",
            "itineraryId": None,
            "content": "Vừa check-in Bà Nà Hills! View đẹp ngoài sức tưởng tượng 😍 Cầu Vàng thật sự rất ấn tượng, ai đến Đà Nẵng nhất định phải ghé!\n\n#DaNang #BaNaHills #CauVang #Travel",
            "mediaUrls": [],
            "taggedLocations": ["Đà Nẵng", "Bà Nà Hills"],
            "likeCount": 234,
            "commentCount": 42,
            "hotScore": 15.6,
            "createdAt": (now - datetime.timedelta(hours=2)).isoformat()
        },
        "posts/post-002": {
            "id": "post-002",
            "authorId": "user_foodie",
            "itineraryId": "itin-phuquoc-3d",
            "content": "Chia sẻ lịch trình 3 ngày ở Phú Quốc cực chi tiết! Mình đã sử dụng TopGo AI Planner để lên kế hoạch và thật sự rất tiện lợi 🏝️\n\n#PhuQuoc #TravelPlan #TopGo",
            "mediaUrls": [],
            "taggedLocations": ["Phú Quốc"],
            "likeCount": 186,
            "commentCount": 28,
            "hotScore": 12.3,
            "createdAt": (now - datetime.timedelta(hours=5)).isoformat()
        },
        "posts/post-003": {
            "id": "post-003",
            "authorId": "user_adventure",
            "itineraryId": None,
            "content": "Bình minh trên đỉnh Fansipan ☀️ Hành trình trek 2 ngày 1 đêm, cảm giác chinh phục nóc nhà Đông Dương thật sự không thể diễn tả bằng lời!\n\nTip: Nên đi vào tháng 10-11 để tránh mưa và có thời tiết đẹp nhất.",
            "mediaUrls": [],
            "taggedLocations": ["Sa Pa", "Fansipan"],
            "likeCount": 312,
            "commentCount": 67,
            "hotScore": 18.2,
            "createdAt": (now - datetime.timedelta(hours=1)).isoformat()
        },
        "posts/post-004": {
            "id": "post-004",
            "authorId": "user_couple",
            "itineraryId": None,
            "content": "Hội An về đêm đẹp lắm mọi người ơi 🏮 Phố cổ lung linh ánh đèn lồng, đi thuyền trên sông Hoài ngắm cảnh cực lãng mạn!\n\n#HoiAn #PhoCo #DenLong",
            "mediaUrls": [],
            "taggedLocations": ["Hội An"],
            "likeCount": 156,
            "commentCount": 23,
            "hotScore": 9.8,
            "createdAt": (now - datetime.timedelta(hours=8)).isoformat()
        },
        "posts/post-005": {
            "id": "post-005",
            "authorId": "user_budget",
            "itineraryId": "itin-hanoi-5d",
            "content": "Review chi tiết lịch trình 5 ngày khám phá Hà Nội với ngân sách chỉ 3 triệu đồng! Bao gồm ăn uống, đi lại, tham quan đầy đủ 🎒\n\nMình đã dùng AI Planner của TopGo để tối ưu chi phí, kết quả ngoài mong đợi!",
            "mediaUrls": [],
            "taggedLocations": ["Hà Nội"],
            "likeCount": 98,
            "commentCount": 15,
            "hotScore": 7.5,
            "createdAt": (now - datetime.timedelta(hours=12)).isoformat()
        },
        "posts/post-006": {
            "id": "post-006",
            "authorId": "user_solo",
            "itineraryId": None,
            "content": "Nha Trang — thiên đường biển miền Trung! 🌊 Bãi biển hoang sơ, hải sản tươi ngon và con người thân thiện. Đây chắc chắn là điểm đến phải thử ít nhất một lần!\n\n#NhaTrang #Beach #SeaFood #VietnamTravel",
            "mediaUrls": [],
            "taggedLocations": ["Nha Trang"],
            "likeCount": 145,
            "commentCount": 19,
            "hotScore": 8.1,
            "createdAt": (now - datetime.timedelta(hours=18)).isoformat()
        }
    }

    # ── Hot Topics ──
    hot_topics = {
        "hot_topics/da_nang": {"name": "Đà Nẵng", "score": 95.0, "postCount": 128, "updatedAt": now.isoformat()},
        "hot_topics/phu_quoc": {"name": "Phú Quốc", "score": 88.5, "postCount": 95, "updatedAt": now.isoformat()},
        "hot_topics/da_lat": {"name": "Đà Lạt", "score": 82.0, "postCount": 87, "updatedAt": now.isoformat()},
        "hot_topics/hoi_an": {"name": "Hội An", "score": 78.3, "postCount": 76, "updatedAt": now.isoformat()},
        "hot_topics/nha_trang": {"name": "Nha Trang", "score": 75.0, "postCount": 64, "updatedAt": now.isoformat()},
        "hot_topics/ha_noi": {"name": "Hà Nội", "score": 72.5, "postCount": 58, "updatedAt": now.isoformat()},
        "hot_topics/sa_pa": {"name": "Sa Pa", "score": 68.0, "postCount": 45, "updatedAt": now.isoformat()},
        "hot_topics/hcm": {"name": "TP. Hồ Chí Minh", "score": 65.5, "postCount": 42, "updatedAt": now.isoformat()},
        "hot_topics/ninh_binh": {"name": "Ninh Bình", "score": 60.0, "postCount": 38, "updatedAt": now.isoformat()},
        "hot_topics/ha_long": {"name": "Hạ Long", "score": 55.0, "postCount": 30, "updatedAt": now.isoformat()},
    }

    # Merge vào data hiện có (không ghi đè dữ liệu cũ)
    data.update(users)
    data.update(follows)
    data.update(itineraries)
    data.update(posts)
    data.update(hot_topics)

    # Ghi lại
    with open(LOCAL_DB_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ Đã seed {len(users)} users, {len(follows)} follows, {len(itineraries)} itineraries, {len(posts)} posts, {len(hot_topics)} hot_topics vào local_db.json")


if __name__ == "__main__":
    seed()
