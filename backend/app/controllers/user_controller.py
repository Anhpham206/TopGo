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
    email: Optional[str] = None

async def get_user_profile(uid: str) -> dict:
    try:
        doc_ref = db.collection("users").document(uid)
        doc = doc_ref.get()
        if doc.exists:
            # Lọc và trả về dữ liệu của document
            data = doc.to_dict()
            # Loại bỏ các trường không cần thiết cho client nếu có
            return data
        return {}
    except Exception as e:
        logger.error(f"Lỗi khi lấy thông tin profile từ Firestore: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lấy thông tin hồ sơ thất bại: {str(e)}"
        )

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
        merged_data = {**existing_data, **new_data}
        
        # Lưu vào Firestore với merge=True
        doc_ref.set(merged_data, merge=True)
        
        logger.info(f"Đã cập nhật profile cho user {uid}")
        return {"status": "success", "message": "Thông tin hồ sơ đã được cập nhật thành công."}
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
            
        # Lọc thông tin công khai
        public_data = {
            "uid": uid,
            "firstname": user_data.get("firstname", ""),
            "lastname": user_data.get("lastname", ""),
            "photoURL": user_data.get("photoURL", None),
            "nationality": user_data.get("nationality", "Việt Nam"),
            "sex": user_data.get("sex", ""),
            "followers_count": counts["followers_count"],
            "following_count": counts["following_count"],
            "is_following": is_following
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
            
            # Map dữ liệu Firestore sang cấu trúc Frontend yêu cầu
            mapped = {
                "id": d.get("id"),
                "author_id": d.get("authorId", uid),
                "content": d.get("content", ""),
                "media": d.get("mediaUrls", []),
                "createdAt": created_at_str,
                "likes_count": d.get("likeCount", 0),
                "comments_count": d.get("commentCount", 0)
            }
            result.append(mapped)
        
        # Sắp xếp bài đăng theo thời gian mới nhất
        result.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        return result
    except Exception as e:
        logger.error(f"Lỗi truy vấn bài đăng của user {uid}: {e}")
        return []

