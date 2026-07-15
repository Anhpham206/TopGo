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

async def create_post(uid: str, postData: CreatePostRequest, authorInfo: dict = None) -> dict:
    """
    Tạo bài viết mới và lưu vào Firestore.
    
    Args:
        uid: Firebase UID của người dùng
        postData: Dữ liệu bài viết từ request
        authorInfo: Decoded Firebase token (chứa name, picture, email)
    
    Returns:
        dict: Post data đầy đủ (bao gồm author info và itinerary nếu có)
    """
    content = postData.content.strip()
    mediaUrls = postData.mediaUrls[:4]  # Max 4 ảnh
    taggedLocations = postData.taggedLocations[:5]  # Max 5 địa điểm
    itineraryId = postData.itineraryId

    # Validate: cần ít nhất content hoặc media
    if not content and not mediaUrls:
        return {"error": "Bài viết cần có nội dung hoặc ảnh", "status": 400}

    try:
        # Tạo document data
        now = datetime.now(timezone.utc)
        postDoc = {
            "authorId": uid,
            "content": content,
            "mediaUrls": mediaUrls,
            "taggedLocations": taggedLocations,
            "itineraryId": itineraryId,
            "likeCount": 0,
            "commentCount": 0,
            "hotScore": 0,
            "createdAt": now.isoformat(),
        }

        # Enrich với author info — ưu tiên từ Firebase token, sau đó tra Firestore
        tokenPhoto = (authorInfo or {}).get("picture") or (authorInfo or {}).get("photoURL") or ""
        tokenName = (authorInfo or {}).get("name") or (authorInfo or {}).get("displayName") or ""

        try:
            userDoc = db.collection("users").document(uid).get()
            if userDoc.exists:
                userData = userDoc.to_dict()
                dbName = userData.get("firstname") or userData.get("displayName") or ""
                if userData.get("lastname"):
                    dbName = f"{userData['lastname']} {dbName}".strip()
                postDoc["authorName"] = dbName or tokenName or "Người dùng TopGo"
                postDoc["authorPhotoUrl"] = (
                    userData.get("photoURL") or userData.get("photoUrl") or
                    tokenPhoto or ""
                )
            else:
                postDoc["authorName"] = tokenName or "Người dùng TopGo"
                postDoc["authorPhotoUrl"] = tokenPhoto or ""
        except Exception as e:
            logger.warning(f"Không thể lấy author info cho {uid}: {e}")
            postDoc["authorName"] = tokenName or "Người dùng TopGo"
            postDoc["authorPhotoUrl"] = tokenPhoto or ""

        # Enrich với itinerary info nếu có
        if itineraryId:
            try:
                itinDoc = db.collection("users").document(uid).collection("saved_plans").document(itineraryId).get()
                if itinDoc.exists:
                    itinData = itinDoc.to_dict()
                    postDoc["itinerary"] = {
                        "id": itineraryId,
                        "destination": itinData.get("destination", ""),
                        "days": itinData.get("days", 0),
                        "budget": itinData.get("budget", 0),
                        "visibility": itinData.get("visibility", "private"),
                    }
                else:
                    postDoc["itinerary"] = None
            except Exception as e:
                logger.warning(f"Không thể lấy itinerary {itineraryId}: {e}")
                postDoc["itinerary"] = None
        else:
            postDoc["itinerary"] = None

        # Lưu vào Firestore sau khi đã enrich đầy đủ thông tin
        import uuid
        postId = str(uuid.uuid4())
        postDoc["id"] = postId
        db.collection("posts").document(postId).set(postDoc)

        # Kích hoạt cập nhật Hot Search ngay lập tức trong background
        try:
            from app.services.hot_search_service import run_hot_score_update
            import threading
            threading.Thread(target=run_hot_score_update, daemon=True).start()
        except Exception as e:
            logger.warning(f"Không thể chạy background hot_score_update: {e}")

        logger.info(f"Tạo post thành công: {postId} bởi user {uid}")
        return postDoc

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
        allPostsDocs = posts_ref.stream()

        userPosts = []
        for doc in allPostsDocs:
            postData = doc.to_dict()
            if not postData:
                continue
            if postData.get("authorId") == uid:
                postData["id"] = doc.id
                userPosts.append(postData)

        # Sắp xếp theo ngày tạo mới nhất
        userPosts.sort(key=lambda x: x.get("createdAt", ""), reverse=True)

        # Enrich posts (chỉ lấy thông tin user 1 lần, nhưng dùng hàm sẵn cho nhanh)
        enriched = []
        for post in userPosts:
            post = _enrich_post_with_author(post)
            post = _enrich_post_with_itinerary(post)
            enriched.append(post)

        return {"posts": enriched, "total": len(enriched)}

    except Exception as e:
        logger.error(f"Lỗi lấy posts của user {uid}: {e}")
        return {"posts": [], "total": 0}


# =========================================================================
# API: XÓA BÀI VIẾT
# =========================================================================

async def delete_post(uid: str, postId: str) -> dict:
    """
    Xóa bài viết của người dùng sau khi xác minh quyền sở hữu.
    """
    try:
        postRef = db.collection("posts").document(postId)
        postDoc = postRef.get()
        if not postDoc.exists:
            return {"error": "Không tìm thấy bài viết", "status": 404}
        
        postData = postDoc.to_dict()
        if postData.get("authorId") != uid:
            return {"error": "Bạn không có quyền xóa bài viết này", "status": 403}
        
        postRef.delete()
        logger.info(f"Xóa post thành công: {postId} bởi user {uid}")
        return {"success": True, "message": "Xóa bài viết thành công"}
    except Exception as e:
        logger.error(f"Lỗi khi xóa post {postId} của user {uid}: {e}")
        return {"error": "Không thể xóa bài viết. Vui lòng thử lại.", "status": 500}


# =========================================================================
# API: CẬP NHẬT BÀI VIẾT (SỬA BÀI VIẾT)
# =========================================================================

async def update_post(uid: str, postId: str, postData: CreatePostRequest) -> dict:
    """
    Cập nhật bài viết của người dùng sau khi xác minh quyền sở hữu.
    """
    content = postData.content.strip()
    mediaUrls = postData.mediaUrls[:4]
    taggedLocations = postData.taggedLocations[:5]
    itineraryId = postData.itineraryId

    if not content and not mediaUrls:
        return {"error": "Bài viết cần có nội dung hoặc ảnh", "status": 400}

    try:
        postRef = db.collection("posts").document(postId)
        postDoc = postRef.get()
        if not postDoc.exists:
            return {"error": "Không tìm thấy bài viết", "status": 404}
        
        existingData = postDoc.to_dict()
        if existingData.get("authorId") != uid:
            return {"error": "Bạn không có quyền sửa bài viết này", "status": 403}
        
        now = datetime.now(timezone.utc)
        updateDict = {
            "content": content,
            "mediaUrls": mediaUrls,
            "taggedLocations": taggedLocations,
            "itineraryId": itineraryId,
            "updatedAt": now.isoformat()
        }

        # Enrich với itinerary info nếu có thay đổi
        if itineraryId:
            try:
                itinDoc = db.collection("itineraries").document(itineraryId).get()
                if itinDoc.exists:
                    itinData = itinDoc.to_dict()
                    updateDict["itinerary"] = {
                        "id": itineraryId,
                        "destination": itinData.get("destination", ""),
                        "days": itinData.get("days", 0),
                        "budget": itinData.get("budget", 0),
                        "visibility": itinData.get("visibility", "private"),
                    }
                else:
                    updateDict["itinerary"] = None
            except Exception as e:
                logger.warning(f"Không thể lấy itinerary {itineraryId}: {e}")
                updateDict["itinerary"] = None
        else:
            updateDict["itinerary"] = None

        # Cập nhật Firestore
        postRef.set(updateDict, merge=True)

        # Lấy lại document mới đầy đủ để trả về kèm tác giả
        from app.controllers.feed_controller import _enrich_post_with_author, _enrich_post_with_itinerary
        updatedDoc = postRef.get().to_dict()
        updatedDoc = _enrich_post_with_author(updatedDoc)
        updatedDoc = _enrich_post_with_itinerary(updatedDoc)

        logger.info(f"Cập nhật post thành công: {postId} bởi user {uid}")
        return updatedDoc
    except Exception as e:
        logger.error(f"Lỗi khi sửa post {postId} của user {uid}: {e}")
        return {"error": "Không thể cập nhật bài viết. Vui lòng thử lại.", "status": 500}


# =========================================================================
# API: LẤY BÀI VIẾT THEO ĐỊA ĐIỂM
# =========================================================================

async def get_posts_by_location(location_name: str) -> dict:
    """
    Lấy danh sách bài viết được gắn thẻ một địa điểm cụ thể.
    """
    if not location_name:
        return {"posts": [], "total": 0}
        
    try:
        from app.controllers.feed_controller import _enrich_post_with_author, _enrich_post_with_itinerary
        
        loc_lower = location_name.lower().strip()
        posts_ref = db.collection("posts")
        allPostsDocs = posts_ref.stream()

        matched_posts = []
        for doc in allPostsDocs:
            data = doc.to_dict()
            data["id"] = doc.id
            
            # Kiểm tra taggedLocations
            tagged_locations = data.get("taggedLocations", [])
            is_match = False
            for loc in tagged_locations:
                if loc_lower in loc.lower():
                    is_match = True
                    break
                    
            if is_match:
                # Bổ sung thông tin tác giả và hành trình
                data = _enrich_post_with_author(data)
                data = _enrich_post_with_itinerary(data)
                matched_posts.append(data)

        # Sắp xếp theo ngày mới nhất
        matched_posts.sort(key=lambda x: x.get("createdAt", ""), reverse=True)

        return {
            "posts": matched_posts,
            "total": len(matched_posts)
        }
    except Exception as e:
        logger.error(f"Lỗi tải bài viết theo địa điểm {location_name}: {e}")
        return {"error": "Không thể lấy bài viết theo địa điểm.", "status": 500}
