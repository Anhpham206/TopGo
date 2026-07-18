import logging
from typing import Optional
from pydantic import BaseModel
from fastapi import HTTPException, status
from app.services.firebase_service import db

logger = logging.getLogger("app.user_controller")

class UserProfileModel(BaseModel):
    firstname: Optional[str] = ""
    lastname: Optional[str] = ""
    dob: Optional[str] = ""
    sex: Optional[str] = ""
    pob: Optional[str] = ""
    nationality: Optional[str] = ""
    photoUrl: Optional[str] = None
    photoURL: Optional[str] = None
    email: Optional[str] = None
    username: Optional[str] = None

async def get_user_profile(uid: str) -> dict:
    try:
        doc_ref = db.collection("users").document(uid)
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            url = data.get("photoURL") or data.get("photoUrl")
            data["photoURL"] = url
            data["photoUrl"] = url
            
            # Đếm số bài viết thực tế
            posts_query = db.collection("posts").where("authorId", "==", uid).stream()
            posts_count = sum(1 for _ in posts_query)
            
            # Đếm số chuyến đi thực tế
            plans_query = db.collection("users").document(uid).collection("saved_plans").stream()
            plans_count = sum(1 for _ in plans_query)
            
            data["postsCount"] = posts_count
            data["tripsCount"] = plans_count
            return data
        return {}
    except Exception as e:
        logger.error(f"Lỗi khi lấy thông tin profile từ Firestore: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lấy thông tin hồ sơ thất bại: {str(e)}"
        )

async def check_username(username: str) -> dict:
    import re
    if not username:
        return {"available": False, "message": "Username không được để trống"}
        
    if len(username) < 3:
        return {"available": False, "message": "Username quá ngắn (phải có ít nhất 3 ký tự)"}
        
    if len(username) > 20:
        return {"available": False, "message": "Username quá dài (tối đa 20 ký tự)"}
        
    if not re.match(r"^[a-z0-9_]+$", username):
        if re.search(r"[A-Z]", username):
            return {"available": False, "message": "Username chỉ được chứa chữ thường (không viết hoa)"}
        elif re.search(r"\s", username):
            return {"available": False, "message": "Username không được chứa khoảng trắng"}
        else:
            return {"available": False, "message": "Username chỉ được chứa chữ cái, số và dấu gạch dưới (_)"}

    try:
        users_ref = db.collection("users")
        query = users_ref.where("username", "==", username).get()
        if len(query) > 0:
            return {"available": False, "message": "Username này đã có người sử dụng. Vui lòng chọn tên khác!"}
        return {"available": True, "message": "Username hợp lệ và có thể sử dụng!"}
    except Exception as e:
        logger.error(f"Lỗi kiểm tra username: {e}")
        raise HTTPException(status_code=500, detail="Lỗi kiểm tra username")

async def update_user_profile(uid: str, profile_data: UserProfileModel) -> dict:
    try:
        doc_ref = db.collection("users").document(uid)
        
        # Lấy dữ liệu cũ để tránh ghi đè làm mất các trường khác nếu có
        existing_data = {}
        doc = doc_ref.get()
        if doc.exists:
            existing_data = doc.to_dict()
            
        # Merge dữ liệu mới
        new_data = profile_data.dict(exclude_unset=True)
        
        # Validate username nếu có
        if "username" in new_data and new_data["username"]:
            import re
            username = new_data["username"]
            if len(username) < 3:
                raise HTTPException(status_code=400, detail="Username quá ngắn (phải có ít nhất 3 ký tự)")
            if len(username) > 20:
                raise HTTPException(status_code=400, detail="Username quá dài (tối đa 20 ký tự)")
            if not re.match(r"^[a-z0-9_]+$", username):
                if re.search(r"[A-Z]", username):
                    raise HTTPException(status_code=400, detail="Username chỉ được chứa chữ thường (không viết hoa)")
                elif re.search(r"\s", username):
                    raise HTTPException(status_code=400, detail="Username không được chứa khoảng trắng")
                else:
                    raise HTTPException(status_code=400, detail="Username chỉ được chứa chữ cái, số và dấu gạch dưới (_)")
            # Kiểm tra duy nhất
            users_ref = db.collection("users")
            query = users_ref.where("username", "==", username).get()
            for q_doc in query:
                if q_doc.id != uid:
                    raise HTTPException(status_code=400, detail="Username này đã có người sử dụng. Vui lòng chọn tên khác!")
                    
        merged_data = {**existing_data, **new_data}
        
        # Lưu vào Firestore với merge=True
        doc_ref.set(merged_data, merge=True)
        
        logger.info(f"Đã cập nhật profile cho user {uid}")
        return {"status": "success", "message": "Thông tin hồ sơ đã được cập nhật thành công."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi khi cập nhật profile lên Firestore: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cập nhật hồ sơ thất bại: {str(e)}"
        )

import datetime

def resolve_uid(uid: str) -> str:
    """Giải mã UID nếu người dùng truyền vào mã hộ chiếu rút gọn dạng 'TG-XXXXXX'."""
    if uid and isinstance(uid, str) and uid.upper().startswith("TG-") and len(uid) == 11:
        short_id = uid[3:].upper()
        # 1. Thử tìm trong Firestore users
        try:
            users_ref = db.collection("users")
            for doc in users_ref.stream():
                if doc.id.upper().startswith(short_id):
                    return doc.id
        except Exception:
            pass
        
        # 2. Thử tìm trong Firebase Authentication
        try:
            from firebase_admin import auth as firebase_auth
            page = firebase_auth.list_users()
            for user in page.users:
                if user.uid.upper().startswith(short_id):
                    return user.uid
        except Exception:
            pass
            
    return uid

async def follow_user(follower_uid: str, following_uid: str) -> dict:
    follower_uid = resolve_uid(follower_uid)
    following_uid = resolve_uid(following_uid)
    
    if follower_uid == following_uid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn không thể tự theo dõi chính mình."
        )
    
    try:
        # Kiểm tra xem user được follow có tồn tại không
        # Nếu chưa có doc trong Firestore nhưng có trong Auth thì tự động tạo profile rỗng cho họ để giữ quan hệ
        target_ref = db.collection("users").document(following_uid)
        if not target_ref.get().exists:
            try:
                from firebase_admin import auth as firebase_auth
                firebase_auth.get_user(following_uid)
                # Tạo doc rỗng
                target_ref.set({"nationality": "Việt Nam", "createdAt": datetime.datetime.now().strftime("%Y-%m-%d")})
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Không tìm thấy người dùng mục tiêu."
                )
            
        doc_id = f"{follower_uid}_{following_uid}"
        doc_ref = db.collection("follows").document(doc_id)
        
        doc_ref.set({
            "follower_uid": follower_uid,
            "following_uid": following_uid,
            "createdAt": datetime.datetime.now().isoformat()
        })
        
        logger.info(f"User {follower_uid} đã follow {following_uid}")
        return {"status": "success", "message": "Đã theo dõi thành công."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi khi follow user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Theo dõi người dùng thất bại: {str(e)}"
        )

async def unfollow_user(follower_uid: str, following_uid: str) -> dict:
    follower_uid = resolve_uid(follower_uid)
    following_uid = resolve_uid(following_uid)
    try:
        doc_id = f"{follower_uid}_{following_uid}"
        doc_ref = db.collection("follows").document(doc_id)
        
        # Xóa document
        doc_ref.delete()
        
        logger.info(f"User {follower_uid} đã unfollow {following_uid}")
        return {"status": "success", "message": "Đã hủy theo dõi thành công."}
    except Exception as e:
        logger.error(f"Lỗi khi unfollow user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hủy theo dõi người dùng thất bại: {str(e)}"
        )

async def check_follow_status(follower_uid: str, following_uid: str) -> bool:
    follower_uid = resolve_uid(follower_uid)
    following_uid = resolve_uid(following_uid)
    try:
        doc_id = f"{follower_uid}_{following_uid}"
        doc_ref = db.collection("follows").document(doc_id)
        return doc_ref.get().exists
    except Exception as e:
        logger.error(f"Lỗi khi kiểm tra trạng thái follow: {e}")
        return False

async def get_follow_counts(uid: str) -> dict:
    uid = resolve_uid(uid)
    try:
        # Đếm số người follow uid này (followers)
        followers_query = db.collection("follows").where("following_uid", "==", uid).count()
        followers_res = followers_query.get()
        try:
            followers_count = followers_res[0].value
        except Exception:
            try:
                followers_count = followers_res[0][0].value
            except Exception:
                followers_count = len(list(db.collection("follows").where("following_uid", "==", uid).stream()))

        # Đếm số người mà uid này đang follow (following)
        following_query = db.collection("follows").where("follower_uid", "==", uid).count()
        following_res = following_query.get()
        try:
            following_count = following_res[0].value
        except Exception:
            try:
                following_count = following_res[0][0].value
            except Exception:
                following_count = len(list(db.collection("follows").where("follower_uid", "==", uid).stream()))

        return {
            "followers_count": followers_count,
            "following_count": following_count
        }
    except Exception as e:
        logger.error(f"Lỗi khi đếm followers/following: {e}")
        return {"followers_count": 0, "following_count": 0}

async def get_public_profile(uid: str, current_user_uid: Optional[str] = None) -> dict:
    uid = resolve_uid(uid)
    if current_user_uid:
        current_user_uid = resolve_uid(current_user_uid)
    try:
        doc_ref = db.collection("users").document(uid)
        doc = doc_ref.get()
        
        user_data = {}
        if doc.exists:
            user_data = doc.to_dict()
        else:
            # Fallback: Lấy thông tin từ Firebase Authentication nếu chưa tạo profile trong Firestore
            try:
                from firebase_admin import auth as firebase_auth
                fb_user = firebase_auth.get_user(uid)
                display_name = fb_user.display_name or ""
                name_parts = display_name.split()
                firstname = name_parts[-1] if name_parts else ""
                lastname = " ".join(name_parts[:-1]) if len(name_parts) > 1 else ""
                user_data = {
                    "firstname": firstname or (fb_user.email.split('@')[0] if fb_user.email else "User"),
                    "lastname": lastname,
                    "photoURL": fb_user.photo_url,
                    "email": fb_user.email,
                    "nationality": "Việt Nam",
                    "createdAt": datetime.datetime.now().strftime("%Y-%m-%d")
                }
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Không tìm thấy người dùng."
                )
        
        # Đếm follow
        counts = await get_follow_counts(uid)
        
        # Kiểm tra trạng thái follow của người dùng hiện tại đối với uid này
        is_following = False
        if current_user_uid and current_user_uid != uid:
            is_following = await check_follow_status(current_user_uid, uid)

        # Đếm số bài viết thực tế
        posts_query = db.collection("posts").where("authorId", "==", uid).stream()
        posts_count = sum(1 for _ in posts_query)
        
        # Đếm số chuyến đi thực tế
        plans_query = db.collection("users").document(uid).collection("saved_plans").stream()
        plans_count = sum(1 for _ in plans_query)
            
        # Lọc thông tin công khai
        url = user_data.get("photoURL") or user_data.get("photoUrl", None)
        public_data = {
            "uid": uid,
            "id": uid,
            "username": user_data.get("username", ""),
            "firstname": user_data.get("firstname", ""),
            "lastname": user_data.get("lastname", ""),
            "photoURL": url,
            "photoUrl": url,
            "nationality": user_data.get("nationality", "Việt Nam"),
            "sex": user_data.get("sex", ""),
            "dob": user_data.get("dob", ""),
            "pob": user_data.get("pob", ""),
            "createdAt": user_data.get("createdAt", ""),
            "followers_count": counts["followers_count"],
            "following_count": counts["following_count"],
            "is_following": is_following,
            "postsCount": posts_count,
            "tripsCount": plans_count,
            "posts_count": posts_count,
            "trips_count": plans_count
        }
        
        return public_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi khi lấy thông tin public profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lấy thông tin trang cá nhân thất bại: {str(e)}"
        )

async def get_user_posts_stub(uid: str) -> list:
    uid = resolve_uid(uid)
    """Truy vấn danh sách bài đăng thực tế của user từ Firestore"""
    try:
        # Lấy thông tin user profile để điền thông tin tác giả cho các bài đăng
        user_doc = db.collection("users").document(uid).get()
        user_data = user_doc.to_dict() if user_doc.exists else {}
        author_name = user_data.get("firstname") or user_data.get("username") or "Ẩn danh"
        if user_data.get("lastname"):
            author_name = f"{user_data.get('lastname')} {author_name}".strip()
        author_avatar = user_data.get("photoURL") or user_data.get("photoUrl") or ""

        posts_ref = db.collection("posts").where("authorId", "==", uid)
        docs = posts_ref.stream()
        result = []
        for doc in docs:
            d = doc.to_dict()
            
            # Chuyển đổi timestamp của Firestore thành chuỗi ISO format
            created_at_str = ""
            if "createdAt" in d and d["createdAt"]:
                if hasattr(d["createdAt"], "isoformat"):
                    created_at_str = d["createdAt"].isoformat()
                else:
                    created_at_str = str(d["createdAt"])
            
            repost_original = d.get("repostOriginal")
            if repost_original and isinstance(repost_original, dict):
                orig_author_id = repost_original.get("authorId") or repost_original.get("author_id")
                if orig_author_id:
                    orig_user_doc = db.collection("users").document(orig_author_id).get()
                    if orig_user_doc.exists:
                        orig_user_data = orig_user_doc.to_dict()
                        orig_name = orig_user_data.get("firstname") or orig_user_data.get("username") or "Ẩn danh"
                        if orig_user_data.get("lastname"):
                            orig_name = f"{orig_user_data.get('lastname')} {orig_name}".strip()
                        repost_original["authorName"] = orig_name
                        repost_original["authorAvatar"] = orig_user_data.get("photoURL") or orig_user_data.get("photoUrl") or ""

            # Map dữ liệu Firestore sang cấu trúc Frontend yêu cầu (hỗ trợ cả camelCase của Thư và snake_case)
            mapped = {
                "id": d.get("id"),
                "authorId": d.get("authorId", uid),
                "author_id": d.get("authorId", uid),
                "authorName": d.get("authorName") or author_name,
                "authorAvatar": d.get("authorAvatar") or author_avatar,
                "content": d.get("content", ""),
                "mediaUrls": d.get("mediaUrls", []),
                "media": d.get("mediaUrls", []),
                "createdAt": created_at_str,
                "likeCount": d.get("likeCount", 0),
                "likes_count": d.get("likeCount", 0),
                "commentCount": d.get("commentCount", 0),
                "comments_count": d.get("commentCount", 0),
                "type": d.get("type", "text"),
                "repostOf": d.get("repostOf"),
                "repostOriginal": repost_original,
                "itineraryId": d.get("itineraryId"),
                "taggedLocations": d.get("taggedLocations", [])
            }
            result.append(mapped)
        
        # Sắp xếp bài đăng theo thời gian mới nhất
        result.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        return result
    except Exception as e:
        logger.error(f"Lỗi truy vấn bài đăng của user {uid}: {e}")
        return []

