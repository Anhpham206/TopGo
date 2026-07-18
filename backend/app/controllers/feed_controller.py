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
import datetime
from typing import Optional
from app.services.firebase_service import db

logger = logging.getLogger("app.feed_controller")


# =========================================================================
# HÀM TIỆN ÍCH: Enrich post data với thông tin author
# =========================================================================

def _enrich_post_with_author(postData: dict, authorCache: dict = None) -> dict:
    """
    Bổ sung thông tin tác giả (displayName, photoUrl) vào bài viết.
    Nếu có authorCache thì tra cứu từ dict (kết quả batch fetch), không gọi DB rời.
    """
    authorId = postData.get("authorId", "")
    if not authorId:
        return postData

    userData = authorCache.get(authorId) if authorCache else None

    if userData is None:
        # Fallback: single fetch nếu không có cache
        try:
            userRef = db.collection("users").document(authorId)
            userDoc = userRef.get()
            userData = userDoc.to_dict() if userDoc.exists else {}
        except Exception as e:
            logger.warning(f"Không thể lấy thông tin author {authorId}: {e}")
            userData = {}

    if userData:
        name = (userData.get("firstname") or userData.get("displayName") or
                userData.get("name") or "")
        if userData.get("lastname"):
            name = f"{userData['lastname']} {name}".strip()
        postData["authorName"] = name or "Người dùng TopGo"
        photo_url = (
            userData.get("photoURL") or
            userData.get("photoUrl") or
            userData.get("photo_url") or
            postData.get("authorPhotoUrl") or
            ""
        )
        postData["authorPhotoUrl"] = photo_url
        postData["authorAvatar"] = photo_url
    else:
        postData.setdefault("authorName", "Người dùng TopGo")
        postData.setdefault("authorPhotoUrl", "")
        postData.setdefault("authorAvatar", "")

    return postData


def _build_authorCache(posts: list) -> dict:
    """
    Tạo dict {authorId: userData} bằng 1 lần scan collection users.
    Tránh N+1 queries khi enrich nhiều bài viết.
    """
    authorIds = {p.get("authorId") for p in posts if p.get("authorId")}
    if not authorIds:
        return {}

    cache = {}
    try:
        # Single scan qua users collection, lọc những authorId cần
        usersRef = db.collection("users")
        for doc in usersRef.stream():
            if doc.id in authorIds:
                cache[doc.id] = doc.to_dict() or {}
                if len(cache) == len(authorIds):
                    break  # Đã tìm đủ, dừng sớm
    except Exception as e:
        logger.warning(f"Không thể batch-fetch authors: {e}")

    return cache


def _enrich_post_with_itinerary(postData: dict) -> dict:
    """
    Nếu post có đính kèm itineraryId, lấy dữ liệu rút gọn của lịch trình.
    """
    itineraryId = postData.get("itineraryId")
    if not itineraryId:
        return postData

    authorId = postData.get("authorId")
    if not authorId:
        return postData

    try:
        # Tìm itinerary trong collection itineraries (Quy tắc mới)
        itinRef = db.collection("itineraries").document(itineraryId)
        itinDoc = itinRef.get()
        if itinDoc.exists:
            itinData = itinDoc.to_dict()
            postData["itinerary"] = {
                "id": itineraryId,
                "destination": itinData.get("destination", ""),
                "days": itinData.get("days", 0),
                "budget": itinData.get("budget", 0),
                "visibility": itinData.get("visibility", "private"),
            }
        else:
            postData["itinerary"] = None
    except Exception as e:
        logger.warning(f"Không thể lấy itinerary {itineraryId}: {e}")
        postData["itinerary"] = None

    return postData


def _get_timestamp(post: dict) -> float:
    """Helper để lấy timestamp an toàn từ trường createdAt (hỗ trợ cả datetime và chuỗi ISO)"""
    dt = post.get("createdAt")
    if isinstance(dt, datetime.datetime):
        return dt.timestamp()
    elif isinstance(dt, str):
        try:
            cleanTime = dt.replace("Z", "+00:00")
            return datetime.datetime.fromisoformat(cleanTime).timestamp()
        except Exception:
            return 0.0
    return 0.0

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
        followingIds = set()
        followsRef = db.collection("follows")
        allFollows = followsRef.stream()
        for doc in allFollows:
            followData = doc.to_dict()
            if followData and followData.get("followerId") == uid:
                following_id = followData.get("followingId")
                if following_id:
                    followingIds.add(following_id)

        # 2. Lấy tất cả posts public
        postsRef = db.collection("posts")
        allPostsDocs = postsRef.stream()

        followingPosts = []
        popularPosts = []

        for doc in allPostsDocs:
            postData = doc.to_dict()
            if not postData:
                continue

            postData["id"] = doc.id

            # Chỉ hiển thị bài có visibility phù hợp (post mặc định là public)
            authorId = postData.get("authorId", "")

            # Thêm bài của người mình theo dõi hoặc bài của chính mình vào followingPosts
            if authorId in followingIds or authorId == uid:
                followingPosts.append(postData)
            else:
                # Bài từ người lạ — thêm vào popular
                popularPosts.append(postData)

        # 3. Merge: ưu tiên following, bổ sung popular
        followingPosts.sort(key=_get_timestamp, reverse=True)
        popularPosts.sort(key=lambda x: x.get("hotScore", 0), reverse=True)

        # Nếu following feed quá ít, bổ sung bài popular
        mergedPosts = followingPosts.copy()
        if len(mergedPosts) < limit:
            remaining = limit - len(mergedPosts)
            mergedPosts.extend(popularPosts[:remaining])

        # 4. Cursor-based pagination
        startIdx = 0
        if cursor:
            for i, post in enumerate(mergedPosts):
                if post.get("id") == cursor:
                    startIdx = i + 1
                    break

        paginated = mergedPosts[startIdx:startIdx + limit]

        # 5. Batch enrich posts (1 author cache scan thay vì N individual queries)
        authorCache = _build_authorCache(paginated)
        enriched = []
        for post in paginated:
            post = _enrich_post_with_author(post, authorCache)
            post = _enrich_post_with_itinerary(post)
            # Serialization an toàn cho Firebase Timestamp
            if isinstance(post.get("createdAt"), datetime.datetime):
                post["createdAt"] = post["createdAt"].isoformat()
            enriched.append(post)

        nextCursor = enriched[-1]["id"] if len(enriched) == limit else None

        return {
            "posts": enriched,
            "nextCursor": nextCursor,
            "total": len(mergedPosts)
        }

    except Exception as e:
        logger.error(f"Lỗi lấy personal feed cho user {uid}: {e}")
        return {"posts": [], "nextCursor": None, "total": 0}


# =========================================================================
# API: LẤY BẢNG TIN KHÁM PHÁ (Explore Feed)
# =========================================================================

async def get_explore_feed(uid: str = None, limit: int = 20, cursor: Optional[str] = None) -> dict:
    """
    Lấy bảng tin khám phá — tất cả bài public, sắp xếp theo hotScore.
    Không cần đăng nhập (uid không bắt buộc, nhưng có thể dùng để cá nhân hóa sau này).
    """
    try:
        postsRef = db.collection("posts")
        allPostsDocs = postsRef.stream()

        allPosts = []
        for doc in allPostsDocs:
            postData = doc.to_dict()
            if not postData:
                continue
            postData["id"] = doc.id
            allPosts.append(postData)

        # Sắp xếp theo hotScore giảm dần, rồi createdAt
        allPosts.sort(
            key=lambda x: (x.get("hotScore", 0), _get_timestamp(x)),
            reverse=True
        )

        # Cursor-based pagination
        startIdx = 0
        if cursor:
            for i, post in enumerate(allPosts):
                if post.get("id") == cursor:
                    startIdx = i + 1
                    break

        paginated = allPosts[startIdx:startIdx + limit]

        # Batch enrich posts (1 author cache scan thay vì N individual queries)
        authorCache = _build_authorCache(paginated)
        enriched = []
        for post in paginated:
            post = _enrich_post_with_author(post, authorCache)
            post = _enrich_post_with_itinerary(post)
            # Serialization an toàn cho Firebase Timestamp
            if isinstance(post.get("createdAt"), datetime.datetime):
                post["createdAt"] = post["createdAt"].isoformat()
            enriched.append(post)

        nextCursor = enriched[-1]["id"] if len(enriched) == limit else None

        return {
            "posts": enriched,
            "nextCursor": nextCursor,
            "total": len(allPosts)
        }

    except Exception as e:
        logger.error(f"Lỗi lấy explore feed: {e}")
        return {"posts": [], "nextCursor": None, "total": 0}
