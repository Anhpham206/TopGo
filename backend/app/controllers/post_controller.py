"""
========================================================================
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
========================================================================
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

class PostCreateRequest(BaseModel):
    content: str
    type: str = "text"                        # "text" | "image" | "itinerary"
    mediaUrls: Optional[List[str]] = []       # Danh sách URL ảnh (Firebase Storage) — schema mới
    taggedLocations: Optional[List[str]] = [] # Tag địa điểm (phân loại, tìm kiếm) — schema mới
    itineraryId: Optional[str] = None        # ID lịch trình đính kèm (nếu type="itinerary")
    visibility: str = "public"               # "public" | "private"


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


# ─── Posts CRUD ─────────────────────────────────────────────────────────────


async def get_post(post_id: str) -> dict:
    """Lấy một bài post theo ID. Không kiểm tra privacy ở đây (để route tự xử lý)."""
    try:
        doc = db.collection("posts").document(post_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy bài post '{post_id}'.")
        return doc.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lấy bài post thất bại: {e}")


async def list_posts(limit: int = 20) -> List[dict]:
    """Lấy danh sách feed (public posts), sắp xếp mới nhất lên đầu."""
    try:
        docs = (
            db.collection("posts")
            .where("visibility", "==", "public")
            .stream()
        )
        posts = [d.to_dict() for d in docs]
        posts.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        return posts[:limit]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lấy danh sách post thất bại: {e}")


async def list_user_posts(uid: str) -> List[dict]:
    """Lấy tất cả bài post của một user (dùng cho trang profile)."""
    try:
        docs = db.collection("posts").where("authorId", "==", uid).stream()
        posts = [d.to_dict() for d in docs]
        posts.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        return posts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lấy bài post của user thất bại: {e}")


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

