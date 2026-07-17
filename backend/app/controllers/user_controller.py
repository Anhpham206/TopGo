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
