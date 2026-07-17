"""
FILE: post_controller.py
CHỨC NĂNG:
- CRUD bài đăng (posts) trên Firestore.
- Xử lý tương tác: Like, Comment, Repost.
- Cấu trúc Firestore:
    posts/{postId}              — bài đăng chính
    likes/{postId}_{userId}     — like riêng biệt (1 user 1 like)
    posts/{postId}/comments/... — subcollection bình luận
- Quy tắc đặt tên:
    authorId  — ID người tạo bài post (camelCase)
    ownerId   — ID chủ sở hữu lịch trình (camelCase, trong itineraries)
"""
import datetime
import logging
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from firebase_admin import firestore as fb_firestore
from pydantic import BaseModel

from app.services.firebase_service import db

logger = logging.getLogger("app.post_controller")


# ─── Pydantic Models ────────────────────────────────────────────────────────

class CommentCreateRequest(BaseModel):
    content: str


class RepostCreateRequest(BaseModel):
    content: Optional[str] = ""    # Nội dung bình luận kèm repost (có thể để trống)


# ─── Helper ─────────────────────────────────────────────────────────────────

def _now_iso() -> str:
    return datetime.datetime.utcnow().isoformat() + "Z"


def _post_id() -> str:
    return f"post-{int(datetime.datetime.utcnow().timestamp() * 1000)}"


def _comment_id() -> str:
    return f"cmt-{int(datetime.datetime.utcnow().timestamp() * 1000)}"



# ─── Like ───────────────────────────────────────────────────────────────────

async def toggle_like(uid: str, post_id: str) -> dict:
    """
    Toggle like cho bài post.
    Lưu vào collection `likes` với document ID = {postId}_{userId}.
    Đảm bảo 1 user chỉ like được 1 lần.
    """
    try:
        like_doc_id = f"{post_id}_{uid}"      # Format bắt buộc: postId_userId
        like_ref = db.collection("likes").document(like_doc_id)
        post_ref = db.collection("posts").document(post_id)

        like_doc = like_ref.get()

        if like_doc.exists:
            # ── Đã like → bỏ like ─────────────────────────────────────────────────────────────
            like_ref.delete()
            post_doc = post_ref.get()
            current_count = post_doc.to_dict().get("likeCount", 1) if post_doc.exists else 1
            post_ref.update({"likeCount": max(0, current_count - 1), "updatedAt": fb_firestore.SERVER_TIMESTAMP})
            logger.info(f"[Like] User {uid} bỏ like bài {post_id}")
            return {"status": "unliked", "postId": post_id}
        else:
            # ── Chưa like → thêm like ───────────────────────────────────────────────────────────
            like_ref.set({
                "postId": post_id,
                "userId": uid,
                "likedAt": _now_iso(),
            })
            post_doc = post_ref.get()
            current_count = post_doc.to_dict().get("likeCount", 0) if post_doc.exists else 0
            post_ref.update({"likeCount": current_count + 1})
            logger.info(f"[Like] User {uid} like bài {post_id}")
            return {"status": "liked", "postId": post_id}

    except Exception as e:
        logger.error(f"[Like] Lỗi toggle like: {e}")
        raise HTTPException(status_code=500, detail=f"Toggle like thất bại: {e}")


async def get_user_like_status(uid: str, post_id: str) -> bool:
    """Kiểm tra user đã like bài post này chưa."""
    try:
        like_doc_id = f"{post_id}_{uid}"
        doc = db.collection("likes").document(like_doc_id).get()
        return doc.exists
    except Exception:
        return False


# ─── Comments ───────────────────────────────────────────────────────────────

async def add_comment(uid: str, author_info: dict, post_id: str, data: CommentCreateRequest) -> dict:
    """Thêm bình luận vào top-level collection `comments` (schema chính thức)."""
    try:
        comment_id = _comment_id()
        comment = {
            "id": comment_id,
            "postId": post_id,                                    # Foreign key về posts
            "authorId": uid,                                      # camelCase bắt buộc
            "authorName": author_info.get("authorName", "Ẩn danh"),
            "authorAvatar": author_info.get("authorAvatar", ""),
            "content": data.content,
            "createdAt": fb_firestore.SERVER_TIMESTAMP,           # Firebase Timestamp
        }
        # ── Lưu vào top-level collection `comments` (schema chính thức) ────────
        db.collection("comments").document(comment_id).set(comment)

        # ── Tăng commentCount trên bài post ──────────────────────────────────
        post_ref = db.collection("posts").document(post_id)
        post_doc = post_ref.get()
        if post_doc.exists:
            current_count = post_doc.to_dict().get("commentCount", 0)
            post_ref.update({
                "commentCount": current_count + 1,
                "updatedAt": fb_firestore.SERVER_TIMESTAMP,
            })

        logger.info(f"[Comment] User {uid} bình luận vào bài {post_id}")
        # Trả về comment với createdAt dạng ISO để frontend hiển thị ngay
        return {"status": "success", "id": comment_id, "comment": {**comment, "createdAt": _now_iso()}}
    except Exception as e:
        logger.error(f"[Comment] Lỗi thêm comment: {e}")
        raise HTTPException(status_code=500, detail=f"Thêm bình luận thất bại: {e}")


async def list_comments(post_id: str) -> List[dict]:
    """Lấy danh sách bình luận từ top-level collection `comments` (schema chính thức)."""
    try:
        docs = (
            db.collection("comments")
            .where("postId", "==", post_id)
            .stream()
        )
        comments = [d.to_dict() for d in docs]
        # Sắp xếp tăng dần theo createdAt (cũ nhất lên đầu)
        comments.sort(key=lambda x: str(x.get("createdAt", "")))
        return comments
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lấy bình luận thất bại: {e}")


# ─── Repost ─────────────────────────────────────────────────────────────────

async def create_repost(uid: str, author_info: dict, post_id: str, data: RepostCreateRequest) -> dict:
    """
    Tạo bài repost (trích dẫn kiểu Twitter).
    Bài mới có `repostOf` = post_id của bài gốc.
    """
    try:
        # Kiểm tra bài gốc tồn tại
        original = await get_post(post_id)

        repost_id = _post_id()
        doc = {
            "id": repost_id,
            "authorId": uid,
            "authorName": author_info.get("authorName", "Ẩn danh"),
            "authorAvatar": author_info.get("authorAvatar", ""),
            "content": data.content or "",
            "type": "repost",
            "mediaUrls": [],
            "taggedLocations": [],
            "itineraryId": None,
            "repostOf": post_id,                 # Trỏ về bài gốc
            "repostOriginal": original,          # Snapshot của bài gốc tại thời điểm repost
            "likeCount": 0,
            "commentCount": 0,
            "hotScore": 0,
            "visibility": "public",
            "createdAt": fb_firestore.SERVER_TIMESTAMP,
            "updatedAt": fb_firestore.SERVER_TIMESTAMP,
        }
        db.collection("posts").document(repost_id).set(doc)
        logger.info(f"[Repost] User {uid} repost bài {post_id} → bài mới {repost_id}")
        return {"status": "success", "id": repost_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Repost] Lỗi tạo repost: {e}")
        raise HTTPException(status_code=500, detail=f"Repost thất bại: {e}")

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
