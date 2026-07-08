"""
========================================================================
FILE: post_controller.py
CHỨC NĂNG:
- API endpoint tạo bài viết mới trên bảng tin.
- Validate input, lưu vào Firestore, enrich với author info.
========================================================================
"""

import logging
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field
from app.services.firebase_service import db

logger = logging.getLogger("app.post_controller")


# =========================================================================
# REQUEST MODEL
# =========================================================================

class CreatePostRequest(BaseModel):
    """Schema cho request tạo bài viết mới."""
    content: str = Field(default="", max_length=2000)
    mediaUrls: List[str] = Field(default_factory=list)
    taggedLocations: List[str] = Field(default_factory=list)
    itineraryId: Optional[str] = None


# =========================================================================
# API: TẠO BÀI VIẾT MỚI
# =========================================================================

async def create_post(uid: str, post_data: CreatePostRequest) -> dict:
    """
    Tạo bài viết mới và lưu vào Firestore.
    
    Args:
        uid: Firebase UID của người dùng
        post_data: Dữ liệu bài viết từ request
    
    Returns:
        dict: Post data đầy đủ (bao gồm author info và itinerary nếu có)
    """
    content = post_data.content.strip()
    media_urls = post_data.mediaUrls[:4]  # Max 4 ảnh
    tagged_locations = post_data.taggedLocations[:5]  # Max 5 địa điểm
    itinerary_id = post_data.itineraryId

    # Validate: cần ít nhất content hoặc media
    if not content and not media_urls:
        return {"error": "Bài viết cần có nội dung hoặc ảnh", "status": 400}

    try:
        # Tạo document data
        now = datetime.now(timezone.utc)
        post_doc = {
            "authorId": uid,
            "content": content,
            "mediaUrls": media_urls,
            "taggedLocations": tagged_locations,
            "itineraryId": itinerary_id,
            "likeCount": 0,
            "commentCount": 0,
            "hotScore": 0,
            "createdAt": now.isoformat(),
        }

        # Lưu vào Firestore
        import uuid
        post_id = str(uuid.uuid4())
        db.collection("posts").document(post_id).set(post_doc)
        
        post_doc["id"] = post_id

        # Enrich với author info
        try:
            user_doc = db.collection("users").document(uid).get()
            if user_doc.exists:
                user_data = user_doc.to_dict()
                post_doc["authorName"] = user_data.get("firstname") or user_data.get("displayName") or "Người dùng TopGo"
                post_doc["authorPhotoUrl"] = user_data.get("photoURL") or user_data.get("photoUrl") or ""
            else:
                post_doc["authorName"] = "Người dùng TopGo"
                post_doc["authorPhotoUrl"] = ""
        except Exception as e:
            logger.warning(f"Không thể lấy author info cho {uid}: {e}")
            post_doc["authorName"] = "Người dùng TopGo"
            post_doc["authorPhotoUrl"] = ""

        # Enrich với itinerary info nếu có
        if itinerary_id:
            try:
                itin_doc = db.collection("itineraries").document(itinerary_id).get()
                if itin_doc.exists:
                    itin_data = itin_doc.to_dict()
                    post_doc["itinerary"] = {
                        "id": itinerary_id,
                        "destination": itin_data.get("destination", ""),
                        "days": itin_data.get("days", 0),
                        "budget": itin_data.get("budget", 0),
                        "visibility": itin_data.get("visibility", "private"),
                    }
                else:
                    post_doc["itinerary"] = None
            except Exception as e:
                logger.warning(f"Không thể lấy itinerary {itinerary_id}: {e}")
                post_doc["itinerary"] = None
        else:
            post_doc["itinerary"] = None

        logger.info(f"Tạo post thành công: {post_id} bởi user {uid}")
        return post_doc

    except Exception as e:
        logger.error(f"Lỗi tạo post cho user {uid}: {e}")
        return {"error": "Không thể tạo bài viết. Vui lòng thử lại.", "status": 500}

# =========================================================================
# API: LẤY BÀI VIẾT CỦA USER (PROFILE)
# =========================================================================

async def get_user_posts(uid: str) -> dict:
    """
    Lấy danh sách bài viết do user đăng để hiển thị trên trang profile.
    """
    try:
        from app.controllers.feed_controller import _enrich_post_with_author, _enrich_post_with_itinerary
        
        posts_ref = db.collection("posts")
        all_posts_docs = posts_ref.stream()

        user_posts = []
        for doc in all_posts_docs:
            post_data = doc.to_dict()
            if not post_data:
                continue
            if post_data.get("authorId") == uid:
                post_data["id"] = doc.id
                user_posts.append(post_data)

        # Sắp xếp theo ngày tạo mới nhất
        user_posts.sort(key=lambda x: x.get("createdAt", ""), reverse=True)

        # Enrich posts (chỉ lấy thông tin user 1 lần, nhưng dùng hàm sẵn cho nhanh)
        enriched = []
        for post in user_posts:
            post = _enrich_post_with_author(post)
            post = _enrich_post_with_itinerary(post)
            enriched.append(post)

        return {"posts": enriched, "total": len(enriched)}

    except Exception as e:
        logger.error(f"Lỗi lấy posts của user {uid}: {e}")
        return {"posts": [], "total": 0}
