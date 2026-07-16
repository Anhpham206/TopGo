from pydantic import BaseModel
from typing import Optional, List
from app.services.firebase_service import db
from firebase_admin import firestore
from fastapi import HTTPException, status
import datetime
import logging
from app.services.ai_logic.ai_moderation import check_content_safety

logger = logging.getLogger("app.post_controller")

class CreatePostRequest(BaseModel):
    itineraryId: Optional[str] = None
    content: str
    mediaUrls: List[str] = []
    taggedLocations: List[str] = []
    visibility: str = "public"

async def create_post(uid: str, req: CreatePostRequest) -> dict:
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
