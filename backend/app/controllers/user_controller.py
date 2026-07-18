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
    username: Optional[str] = None

async def get_user_profile(uid: str) -> dict:
    try:
        doc_ref = db.collection("users").document(uid)
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            
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

async def get_public_user_profile(user_id: str) -> dict:
    try:
        doc_ref = db.collection("users").document(user_id)
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            # Loại bỏ các trường nhạy cảm
            sensitive_fields = ['email', 'phone', 'address']
            for field in sensitive_fields:
                if field in data:
                    del data[field]
            
            # Thêm id vào response (để cho đồng nhất)
            if 'id' not in data:
                data['id'] = user_id

            # Đếm số bài viết thực tế
            posts_query = db.collection("posts").where("authorId", "==", user_id).stream()
            posts_count = sum(1 for _ in posts_query)
            
            # Đếm số chuyến đi thực tế
            plans_query = db.collection("users").document(user_id).collection("saved_plans").stream()
            plans_count = sum(1 for _ in plans_query)
            
            data["postsCount"] = posts_count
            data["tripsCount"] = plans_count
                
            return data
        
        # Nếu không tìm thấy, trả về 404
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy người dùng"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi khi lấy public profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Đã xảy ra lỗi khi tải hồ sơ"
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
