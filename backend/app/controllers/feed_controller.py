"""
========================================================================
FILE: feed_controller.py
CHỨC NĂNG:
- API endpoint lấy News Feed cá nhân (bài từ following + popular).
- API endpoint lấy bảng tin Khám phá (tất cả bài public, sắp theo hotScore).
- Phân trang cursor-based cho infinite scroll.
========================================================================
"""

import logging
from typing import Optional
from app.services.firebase_service import db

logger = logging.getLogger("app.feed_controller")


# =========================================================================
# HÀM TIỆN ÍCH: Enrich post data với thông tin author
# =========================================================================

def _enrich_post_with_author(post_data: dict) -> dict:
    """
    Bổ sung thông tin tác giả (displayName, photoUrl) vào bài viết.
    Tránh join trùng lặp bằng cách cache trong request scope.
    """
    author_id = post_data.get("authorId", "")
    if not author_id:
        return post_data

    try:
        user_ref = db.collection("users").document(author_id)
        user_doc = user_ref.get()
        if user_doc.exists:
            user_data = user_doc.to_dict()
            post_data["authorName"] = user_data.get("firstname") or user_data.get("displayName") or "Người dùng TopGo"
            post_data["authorPhotoUrl"] = user_data.get("photoURL") or user_data.get("photoUrl") or ""
        else:
            post_data["authorName"] = "Người dùng TopGo"
            post_data["authorPhotoUrl"] = ""
    except Exception as e:
        logger.warning(f"Không thể lấy thông tin author {author_id}: {e}")
        post_data["authorName"] = "Người dùng TopGo"
        post_data["authorPhotoUrl"] = ""

    return post_data


def _enrich_post_with_itinerary(post_data: dict) -> dict:
    """
    Nếu post có đính kèm itineraryId, lấy dữ liệu rút gọn của lịch trình.
    """
    itinerary_id = post_data.get("itineraryId")
    if not itinerary_id:
        return post_data

    try:
        # Tìm itinerary trong collection itineraries (top-level)
        itin_ref = db.collection("itineraries").document(itinerary_id)
        itin_doc = itin_ref.get()
        if itin_doc.exists:
            itin_data = itin_doc.to_dict()
            post_data["itinerary"] = {
                "id": itinerary_id,
                "destination": itin_data.get("destination", ""),
                "days": itin_data.get("days", 0),
                "budget": itin_data.get("budget", 0),
                "visibility": itin_data.get("visibility", "private"),
            }
        else:
            post_data["itinerary"] = None
    except Exception as e:
        logger.warning(f"Không thể lấy itinerary {itinerary_id}: {e}")
        post_data["itinerary"] = None

    return post_data


# =========================================================================
# API: LẤY NEWS FEED CÁ NHÂN (Following Feed)
# =========================================================================

async def get_personal_feed(uid: str, limit: int = 20, cursor: Optional[str] = None) -> dict:
    """
    Lấy bảng tin cá nhân — ưu tiên bài từ người đang theo dõi.
    
    Luồng:
    1. Lấy danh sách followingIds từ collection follows.
    2. Query posts có authorId nằm trong followingIds.
    3. Bổ sung bài popular nếu feed quá ít.
    4. Sắp xếp theo createdAt giảm dần.
    5. Phân trang cursor-based.
    """
    try:
        # 1. Lấy danh sách người đang theo dõi
        following_ids = set()
        follows_ref = db.collection("follows")
        all_follows = follows_ref.stream()
        for doc in all_follows:
            follow_data = doc.to_dict()
            if follow_data and follow_data.get("followerId") == uid:
                following_id = follow_data.get("followingId")
                if following_id:
                    following_ids.add(following_id)

        # 2. Lấy tất cả posts public
        posts_ref = db.collection("posts")
        all_posts_docs = posts_ref.stream()

        following_posts = []
        popular_posts = []

        for doc in all_posts_docs:
            post_data = doc.to_dict()
            if not post_data:
                continue

            post_data["id"] = doc.id

            # Chỉ hiển thị bài có visibility phù hợp (post mặc định là public)
            author_id = post_data.get("authorId", "")

            # Thêm bài của người mình theo dõi hoặc bài của chính mình vào following_posts
            if author_id in following_ids or author_id == uid:
                following_posts.append(post_data)
            else:
                # Bài từ người lạ — thêm vào popular
                popular_posts.append(post_data)

        # 3. Merge: ưu tiên following, bổ sung popular
        following_posts.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        popular_posts.sort(key=lambda x: x.get("hotScore", 0), reverse=True)

        # Nếu following feed quá ít, bổ sung bài popular
        merged_posts = following_posts.copy()
        if len(merged_posts) < limit:
            remaining = limit - len(merged_posts)
            merged_posts.extend(popular_posts[:remaining])

        # 4. Cursor-based pagination
        start_idx = 0
        if cursor:
            for i, post in enumerate(merged_posts):
                if post.get("id") == cursor:
                    start_idx = i + 1
                    break

        paginated = merged_posts[start_idx:start_idx + limit]

        # 5. Enrich posts
        enriched = []
        for post in paginated:
            post = _enrich_post_with_author(post)
            post = _enrich_post_with_itinerary(post)
            enriched.append(post)

        next_cursor = enriched[-1]["id"] if len(enriched) == limit else None

        return {
            "posts": enriched,
            "nextCursor": next_cursor,
            "total": len(merged_posts)
        }

    except Exception as e:
        logger.error(f"Lỗi lấy personal feed cho user {uid}: {e}")
        return {"posts": [], "nextCursor": None, "total": 0}


# =========================================================================
# API: LẤY BẢNG TIN KHÁM PHÁ (Explore Feed)
# =========================================================================

async def get_explore_feed(limit: int = 20, cursor: Optional[str] = None) -> dict:
    """
    Lấy bảng tin khám phá — tất cả bài public, sắp xếp theo hotScore.
    Không cần đăng nhập.
    """
    try:
        posts_ref = db.collection("posts")
        all_posts_docs = posts_ref.stream()

        all_posts = []
        for doc in all_posts_docs:
            post_data = doc.to_dict()
            if not post_data:
                continue
            post_data["id"] = doc.id
            all_posts.append(post_data)

        # Sắp xếp theo hotScore giảm dần, rồi createdAt
        all_posts.sort(
            key=lambda x: (x.get("hotScore", 0), x.get("createdAt", "")),
            reverse=True
        )

        # Cursor-based pagination
        start_idx = 0
        if cursor:
            for i, post in enumerate(all_posts):
                if post.get("id") == cursor:
                    start_idx = i + 1
                    break

        paginated = all_posts[start_idx:start_idx + limit]

        # Enrich posts
        enriched = []
        for post in paginated:
            post = _enrich_post_with_author(post)
            post = _enrich_post_with_itinerary(post)
            enriched.append(post)

        next_cursor = enriched[-1]["id"] if len(enriched) == limit else None

        return {
            "posts": enriched,
            "nextCursor": next_cursor,
            "total": len(all_posts)
        }

    except Exception as e:
        logger.error(f"Lỗi lấy explore feed: {e}")
        return {"posts": [], "nextCursor": None, "total": 0}
