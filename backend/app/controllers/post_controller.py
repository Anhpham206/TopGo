"""
========================================================================
FILE: post_controller.py
CHỨC NĂNG:
- CRUD bài đăng (posts) trên Firestore.
- Xử lý tương tác: Like, Comment, Repost.
- Kiểm duyệt nội dung bằng AI (Gemini), lưu Firestore.
- Cấu trúc Firestore:
    posts/{postId}              — bài đăng chính
    likes/{postId}_{userId}     — like riêng biệt (1 user 1 like)
    posts/{postId}/comments/... — subcollection bình luận
- Quy tắc đặt tên:
    authorId  — ID người tạo bài post (camelCase)
    ownerId   — ID chủ sở hữu lịch trình (camelCase, trong itineraries)
========================================================================
"""
import logging
import datetime
from datetime import timezone
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from firebase_admin import firestore as fb_firestore
from firebase_admin import firestore
from pydantic import BaseModel, Field

from app.services.firebase_service import db
from app.services.ai_logic.ai_moderation import check_content_safety

logger = logging.getLogger("app.post_controller")

import unicodedata

VIETNAM_PROVINCES = [
    "An Giang", "Bà Rịa - Vũng Tàu", "Bạc Liêu", "Bắc Giang", "Bắc Kạn",
    "Bắc Ninh", "Bến Tre", "Bình Dương", "Bình Định", "Bình Phước",
    "Bình Thuận", "Cà Mau", "Cao Bằng", "Cần Thơ", "Đà Nẵng",
    "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp",
    "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội", "Hà Tĩnh",
    "Hải Dương", "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hưng Yên",
    "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", "Lạng Sơn",
    "Lào Cai", "Lâm Đồng", "Long An", "Nam Định", "Nghệ An",
    "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình",
    "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng",
    "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa",
    "Thừa Thiên Huế", "Tiền Giang", "Trà Vinh", "Tuyên Quang", "Vĩnh Long",
    "Vĩnh Phúc", "Yên Bái", "TP. Hồ Chí Minh"
]

def strip_accents(s: str) -> str:
    return ''.join(c for c in unicodedata.normalize('NFD', s)
                  if unicodedata.category(c) != 'Mn')

def normalize_location(name: str) -> Optional[str]:
    if not name:
        return None
    name_clean = strip_accents(name).lower().strip()
    
    # Custom tourist mappings
    mappings = {
        "phu quoc": "Kiên Giang",
        "sapa": "Lào Cai",
        "sa pa": "Lào Cai",
        "da lat": "Lâm Đồng",
        "hoi an": "Quảng Nam",
        "nha trang": "Khánh Hòa",
        "mui ne": "Bình Thuận",
        "vung tau": "Bà Rịa - Vũng Tàu",
        "con dao": "Bà Rịa - Vũng Tàu",
        "phong nha": "Quảng Bình",
        "ha long": "Quảng Ninh",
        "cat ba": "Hải Phòng",
        "sai gon": "TP. Hồ Chí Minh",
        "tphcm": "TP. Hồ Chí Minh",
        "hcm": "TP. Hồ Chí Minh",
    }
    for key, province in mappings.items():
        if key in name_clean:
            return province
            
    for p in VIETNAM_PROVINCES:
        p_clean = strip_accents(p).lower().strip()
        if p_clean in name_clean or name_clean in p_clean:
            return p
            
    return None

def _clean_and_enrich_post_locations(tagged_locations: list, itinerary_id: Optional[str], uid: str) -> list:
    valid_tags = []
    # 1. Chuẩn hóa tag thủ công từ người dùng
    if tagged_locations:
        for tag in tagged_locations:
            norm = normalize_location(tag)
            if norm and norm not in valid_tags:
                valid_tags.append(norm)

    # 2. Tự động trích xuất địa danh của lịch trình đính kèm
    if itinerary_id:
        try:
            itin_ref = db.collection("itineraries").document(itinerary_id)
            itin_doc = itin_ref.get()
            itin_dest = None
            if itin_doc.exists:
                itin_dest = itin_doc.to_dict().get("destination")
            else:
                user_plan_ref = db.collection("users").document(uid).collection("saved_plans").document(itinerary_id)
                user_plan_doc = user_plan_ref.get()
                if user_plan_doc.exists:
                    itin_dest = user_plan_doc.to_dict().get("destination")

            if itin_dest:
                norm_itin_dest = normalize_location(itin_dest)
                if norm_itin_dest and norm_itin_dest not in valid_tags:
                    valid_tags.append(norm_itin_dest)
        except Exception as e:
            logger.warning(f"Lỗi tự động trích xuất tỉnh thành từ lịch trình {itinerary_id}: {e}")

    return valid_tags


# ─── Pydantic Models ────────────────────────────────────────────────────────

class CommentCreateRequest(BaseModel):
    content: str


class RepostCreateRequest(BaseModel):
    content: Optional[str] = ""    # Nội dung bình luận kèm repost (có thể để trống)


class CreatePostRequest(BaseModel):
    """Schema cho request tạo & cập nhật bài viết."""
    itineraryId: Optional[str] = None
    content: str = Field(default="")
    mediaUrls: List[str] = Field(default_factory=list)
    taggedLocations: List[str] = Field(default_factory=list)
    visibility: str = "public"


# ─── Helper ─────────────────────────────────────────────────────────────────

def _now_iso() -> str:
    return datetime.datetime.utcnow().isoformat() + "Z"


def _post_id() -> str:
    return f"post-{int(datetime.datetime.utcnow().timestamp() * 1000)}"


def _comment_id() -> str:
    return f"cmt-{int(datetime.datetime.utcnow().timestamp() * 1000)}"


def _sync_post_itinerary(uid: str, itinerary_id: Optional[str]):
    if not itinerary_id:
        return
    try:
        itin_ref = db.collection("itineraries").document(itinerary_id)
        if itin_ref.get().exists:
            return

        # Nếu là mock preview, tạo nhanh mock data trong collection itineraries
        if itinerary_id == "trip-preview-1":
            mock_data = {
                "id": "trip-preview-1",
                "destination": "Phú Quốc Hè 2026",
                "days": 4,
                "pax": 2,
                "budget": 8500000.0,
                "dateStart": "2026-07-20",
                "dateEnd": "2026-07-24",
                "itinerary": '{"output":{"Lich_trinh":[[{"Dia_diem":"Bãi Sao"},{"Dia_diem":"Chợ Đêm"}]]}}',
                "visibility": "public",
                "ownerId": "mock-admin",
                "createdAt": firestore.SERVER_TIMESTAMP
            }
            itin_ref.set(mock_data)
            logger.info("Đã seed mock trip-preview-1")
            return
        elif itinerary_id == "trip-preview-2":
            mock_data = {
                "id": "trip-preview-2",
                "destination": "Sapa Sương Mù",
                "days": 3,
                "pax": 4,
                "budget": 4500000.0,
                "dateStart": "2026-11-15",
                "dateEnd": "2026-11-18",
                "itinerary": '{"output":{"Lich_trinh":[[{"Dia_diem":"Bản Cát Cát"},{"Dia_diem":"Fansipan"}]]}}',
                "visibility": "public",
                "ownerId": "mock-admin",
                "createdAt": firestore.SERVER_TIMESTAMP
            }
            itin_ref.set(mock_data)
            logger.info("Đã seed mock trip-preview-2")
            return

        # Nếu là lịch trình của user lưu trong saved_plans, copy sang itineraries để share
        user_plan_ref = db.collection("users").document(uid).collection("saved_plans").document(itinerary_id)
        user_plan_doc = user_plan_ref.get()
        if user_plan_doc.exists:
            plan_data = user_plan_doc.to_dict()
            shared_data = {
                "id": itinerary_id,
                "destination": plan_data.get("destination", "Lịch trình"),
                "days": int(plan_data.get("days", 1)),
                "pax": int(plan_data.get("pax", 1)),
                "budget": float(plan_data.get("budget", 0.0)),
                "dateStart": plan_data.get("dateStart", ""),
                "dateEnd": plan_data.get("dateEnd", ""),
                "itinerary": plan_data.get("itinerary", ""),
                "visibility": "public",
                "ownerId": uid,
                "createdAt": firestore.SERVER_TIMESTAMP
            }
            itin_ref.set(shared_data)
            logger.info(f"Đã tự động share saved_plan {itinerary_id} sang itineraries cho user {uid}")
    except Exception as e:
        logger.warning(f"Lỗi khi đồng bộ itinerary {itinerary_id}: {e}")


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


# ─── Get Single Post ──────────────────────────────────────────────────────────

async def get_post(post_id: str) -> dict:
    """Lấy chi tiết một bài viết."""
    try:
        doc_ref = db.collection("posts").document(post_id).get()
        if not doc_ref.exists:
            raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")
        post_data = doc_ref.to_dict()
        post_data["id"] = post_id
        
        # Enrich posts với author và itinerary
        from app.controllers.feed_controller import _enrich_post_with_author, _enrich_post_with_itinerary
        post_data = _enrich_post_with_author(post_data)
        post_data = _enrich_post_with_itinerary(post_data)
        
        return post_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lấy bài viết: {e}")


# ─── Repost ─────────────────────────────────────────────────────────────────

async def create_repost(uid: str, author_info: dict, post_id: str, data: RepostCreateRequest) -> dict:
    """
    Tạo bài repost (trích dẫn kiểu Twitter).
    Bài mới có `repostOf` = post_id của bài gốc.
    """
    try:
        # Lấy dữ liệu bài gốc để lưu snapshot
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
        # Đồng bộ lịch trình từ saved_plans sang itineraries (hoặc seed preview mock)
        _sync_post_itinerary(uid, req.itineraryId)
        
        doc_data["id"] = post_id
        doc_data["authorId"] = uid
        doc_data["likeCount"] = 0
        doc_data["commentCount"] = 0
        doc_data["hotScore"] = 0
        doc_data["createdAt"] = firestore.SERVER_TIMESTAMP
        doc_data["taggedLocations"] = _clean_and_enrich_post_locations(req.taggedLocations, req.itineraryId, uid)

        # Determine type based on provided data
        if doc_data.get("itineraryId"):
            doc_data["type"] = "itinerary"
        elif doc_data.get("mediaUrls") and len(doc_data["mediaUrls"]) > 0:
            doc_data["type"] = "image"
        else:
            doc_data["type"] = "text"
        
        # 3. Lưu vào root collection "posts"
        db.collection("posts").document(post_id).set(doc_data)
        
        # 4. Kích hoạt cập nhật Hot Search trong background (nếu có)
        try:
            from app.services.hot_search_service import run_hot_score_update
            import threading
            threading.Thread(target=run_hot_score_update, daemon=True).start()
        except Exception as e:
            logger.warning(f"Không thể chạy background hot_score_update: {e}")

        # 5. Trả về đối tượng Post hoàn chỉnh đã được làm giàu thông tin tác giả và lộ trình để frontend hiển thị ngay
        from app.controllers.feed_controller import _enrich_post_with_author, _enrich_post_with_itinerary
        
        response_data = doc_data.copy()
        # Thay thế SERVER_TIMESTAMP (không serialize được sang JSON) bằng thời gian hiện tại dưới dạng chuỗi ISO
        response_data["createdAt"] = datetime.datetime.now().isoformat()
        response_data = _enrich_post_with_author(response_data)
        response_data = _enrich_post_with_itinerary(response_data)

        logger.info(f"User {uid} đã đăng bài post {post_id} thành công.")
        return response_data
        
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
        # Đồng bộ lịch trình sang itineraries
        _sync_post_itinerary(uid, postData.itineraryId)
        
        updateDict = {
            "content": postData.content.strip(),
            "mediaUrls": postData.mediaUrls[:4],
            "taggedLocations": _clean_and_enrich_post_locations(postData.taggedLocations, postData.itineraryId, uid),
            "itineraryId": postData.itineraryId,
            "visibility": postData.visibility,
            "updatedAt": now.isoformat()
        }

        # Determine type based on provided data
        if updateDict.get("itineraryId"):
            updateDict["type"] = "itinerary"
        elif updateDict.get("mediaUrls") and len(updateDict["mediaUrls"]) > 0:
            updateDict["type"] = "image"
        else:
            updateDict["type"] = "text"

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