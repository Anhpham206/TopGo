"""
========================================================================
FILE: post_controller.py
CHỨC NĂNG:
- API endpoint quản lý bài viết trên bảng tin.
- Kiểm duyệt nội dung bằng AI (Gemini), lưu Firestore.
========================================================================
"""

import logging
import datetime
from datetime import timezone
from typing import Optional, List
from pydantic import BaseModel, Field

from fastapi import HTTPException, status
from firebase_admin import firestore
from app.services.firebase_service import db
from app.services.ai_logic.ai_moderation import check_content_safety

logger = logging.getLogger("app.post_controller")


# =========================================================================
# REQUEST MODEL
# =========================================================================

class CreatePostRequest(BaseModel):
    """Schema cho request tạo & cập nhật bài viết."""
    itineraryId: Optional[str] = None
    content: str = Field(default="")
    mediaUrls: List[str] = Field(default_factory=list)
    taggedLocations: List[str] = Field(default_factory=list)
    visibility: str = "public"


# =========================================================================
# API: TẠO BÀI VIẾT MỚI (Code phê duyệt từ main)
# =========================================================================

async def create_post(uid: str, req: CreatePostRequest) -> dict:
    """
    Tạo bài viết mới, kiểm duyệt nội dung qua AI Gemini và lưu vào Firestore.
    """
    try:
        # 1. Kiểm duyệt nội dung bằng AI Gemini
        safety_check = await check_content_safety(req.content)
        if not safety_check["is_safe"]:
            logger.warning(f"User {uid} attempted to post unsafe content.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=safety_check["reason"]
            )
        
        # 2. Chuẩn bị dữ liệu Post
        post_id = f"post-{int(datetime.datetime.now().timestamp() * 1000)}"
        doc_data = req.dict()
        doc_data["id"] = post_id
        doc_data["authorId"] = uid
        doc_data["likeCount"] = 0
        doc_data["commentCount"] = 0
        doc_data["hotScore"] = 0
        doc_data["createdAt"] = firestore.SERVER_TIMESTAMP
        
        # 3. Lưu vào root collection "posts"
        db.collection("posts").document(post_id).set(doc_data)
        
        # 4. Kích hoạt cập nhật Hot Search trong background (nếu có)
        try:
            from app.services.hot_search_service import run_hot_score_update
            import threading
            threading.Thread(target=run_hot_score_update, daemon=True).start()
        except Exception as e:
            logger.warning(f"Không thể chạy background hot_score_update: {e}")

        logger.info(f"User {uid} đã đăng bài post {post_id} thành công.")
        return {"status": "success", "id": post_id, "message": "Đăng bài thành công!"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi tạo post: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Tạo bài viết thất bại: {str(e)}"
        )


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
        userPosts.sort(key=lambda x: str(x.get("createdAt", "")), reverse=True)

        # Enrich posts với author và itinerary
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
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy bài viết"
            )
        
        postData = postDoc.to_dict()
        if postData.get("authorId") != uid:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền xóa bài viết này"
            )
        
        postRef.delete()
        logger.info(f"Xóa post thành công: {postId} bởi user {uid}")
        return {"success": True, "message": "Xóa bài viết thành công"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi khi xóa post {postId} của user {uid}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể xóa bài viết. Vui lòng thử lại."
        )


# =========================================================================
# API: CẬP NHẬT BÀI VIẾT (SỬA BÀI VIẾT)
# =========================================================================

async def update_post(uid: str, postId: str, postData: CreatePostRequest) -> dict:
    """
    Cập nhật bài viết của người dùng (có kiểm duyệt lại nội dung bằng AI).
    """
    # Kiểm duyệt lại nội dung bài viết mới
    safety_check = await check_content_safety(postData.content)
    if not safety_check["is_safe"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=safety_check["reason"]
        )

    try:
        postRef = db.collection("posts").document(postId)
        postDoc = postRef.get()
        if not postDoc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy bài viết"
            )
        
        existingData = postDoc.to_dict()
        if existingData.get("authorId") != uid:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền sửa bài viết này"
            )
        
        now = datetime.datetime.now(timezone.utc)
        updateDict = {
            "content": postData.content.strip(),
            "mediaUrls": postData.mediaUrls[:4],
            "taggedLocations": postData.taggedLocations[:5],
            "itineraryId": postData.itineraryId,
            "visibility": postData.visibility,
            "updatedAt": now.isoformat()
        }

        # Cập nhật Firestore
        postRef.set(updateDict, merge=True)

        from app.controllers.feed_controller import _enrich_post_with_author, _enrich_post_with_itinerary
        updatedDoc = postRef.get().to_dict()
        updatedDoc["id"] = postId
        updatedDoc = _enrich_post_with_author(updatedDoc)
        updatedDoc = _enrich_post_with_itinerary(updatedDoc)

        logger.info(f"Cập nhật post thành công: {postId} bởi user {uid}")
        return updatedDoc
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi khi sửa post {postId} của user {uid}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể cập nhật bài viết. Vui lòng thử lại."
        )


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
            if not data:
                continue
            data["id"] = doc.id
            
            tagged_locations = data.get("taggedLocations", [])
            is_match = any(loc_lower in str(loc).lower() for loc in tagged_locations)
                    
            if is_match:
                data = _enrich_post_with_author(data)
                data = _enrich_post_with_itinerary(data)
                matched_posts.append(data)

        matched_posts.sort(key=lambda x: str(x.get("createdAt", "")), reverse=True)

        return {
            "posts": matched_posts,
            "total": len(matched_posts)
        }
    except Exception as e:
        logger.error(f"Lỗi tải bài viết theo địa điểm {location_name}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể lấy bài viết theo địa điểm."
        )