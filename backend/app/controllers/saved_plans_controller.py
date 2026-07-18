import datetime
import logging
from typing import Optional, Any, Dict, List
from pydantic import BaseModel
from fastapi import HTTPException, status
from app.services.firebase_service import db

logger = logging.getLogger("app.saved_plans_controller")

class PlanSaveRequest(BaseModel):
    id: Optional[str] = None
    destination: str
    days: int
    pax: int
    budget: Optional[float] = 0.0
    dateStart: Optional[str] = ""
    dateEnd: Optional[str] = ""
    itinerary: Optional[str] = None  # Dữ liệu đầy đủ của lịch trình được sinh ra từ AI dưới dạng chuỗi JSON

async def save_plan(uid: str, plan_data: PlanSaveRequest) -> dict:
    """
    Lưu lịch trình vào Firestore tại collection users/{uid}/saved_plans/{plan_id}.
    Nếu plan_data không có id, một id mới dạng trip-<timestamp> sẽ được tạo ra.
    """
    try:
        plan_id = plan_data.id
        if not plan_id:
            plan_id = f"trip-{int(datetime.datetime.now().timestamp() * 1000)}"

        # Chuẩn bị dữ liệu lưu
        doc_data = plan_data.dict()
        doc_data["id"] = plan_id
        doc_data["savedAt"] = datetime.datetime.now().isoformat()

        # Tham chiếu và ghi dữ liệu vào Firestore
        doc_ref = db.collection("users").document(uid).collection("saved_plans").document(plan_id)
        doc_ref.set(doc_data)

        logger.info(f"Đã lưu lịch trình {plan_id} cho user {uid}")
        return {"status": "success", "id": plan_id, "message": "Lịch trình đã được lưu thành công."}

    except Exception as e:
        logger.error(f"Lỗi khi lưu lịch trình vào Firestore: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lưu lịch trình thất bại: {str(e)}"
        )

async def list_plans(uid: str) -> List[dict]:
    """
    Lấy danh sách các lịch trình đã lưu của người dùng từ Firestore.
    Sắp xếp theo thời gian lưu giảm dần (mới nhất lên đầu).
    """
    try:
        plans_ref = db.collection("users").document(uid).collection("saved_plans")
        docs = plans_ref.stream()

        plans = []
        for doc in docs:
            plans.append(doc.to_dict())

        # Sắp xếp thủ công trong bộ nhớ để bảo đảm luôn chạy tốt ngay cả khi Firestore chưa tạo xong index
        plans.sort(key=lambda x: x.get("savedAt", ""), reverse=True)

        logger.info(f"Đã lấy {len(plans)} lịch trình cho user {uid}")
        return plans

    except Exception as e:
        logger.error(f"Lỗi khi lấy danh sách lịch trình từ Firestore: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lấy danh sách lịch trình thất bại: {str(e)}"
        )

async def delete_plan(uid: str, plan_id: str) -> dict:
    """
    Xóa lịch trình cụ thể của người dùng khỏi Firestore.
    """
    try:
        doc_ref = db.collection("users").document(uid).collection("saved_plans").document(plan_id)
        
        # Kiểm tra xem tài liệu có tồn tại không trước khi xóa
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy lịch trình với mã {plan_id}."
            )

        doc_ref.delete()
        logger.info(f"Đã xóa lịch trình {plan_id} của user {uid}")
        return {"status": "success", "message": f"Đã xóa thành công lịch trình {plan_id}."}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi khi xóa lịch trình khỏi Firestore: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Xóa lịch trình thất bại: {str(e)}"
        )

async def get_plan(uid: str, plan_id: str) -> dict:
    """Lấy thông tin chi tiết một lịch trình cụ thể của người dùng."""
    from app.controllers.user_controller import resolve_uid
    uid = resolve_uid(uid)
    try:
        doc_ref = db.collection("users").document(uid).collection("saved_plans").document(plan_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy lịch trình với mã {plan_id}."
            )
        return doc.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi khi lấy chi tiết lịch trình: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lấy chi tiết lịch trình thất bại: {str(e)}"
        )

async def clone_plan(current_user_uid: str, target_user_uid: str, target_plan_id: str) -> dict:
    """Nhân bản lịch trình của người dùng khác về tài khoản của mình."""
    from app.controllers.user_controller import resolve_uid
    current_user_uid = resolve_uid(current_user_uid)
    target_user_uid = resolve_uid(target_user_uid)
    
    if current_user_uid == target_user_uid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn không thể nhân bản lịch trình của chính mình."
        )
    try:
        # Lấy lịch trình nguồn
        source_ref = db.collection("users").document(target_user_uid).collection("saved_plans").document(target_plan_id)
        source_doc = source_ref.get()
        if not source_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy lịch trình nguồn để sao chép."
            )
        
        source_data = source_doc.to_dict()
        
        # Tạo ID lịch trình mới
        new_plan_id = f"trip-{int(datetime.datetime.now().timestamp() * 1000)}"
        
        # Tạo dữ liệu mới cho user hiện tại
        new_plan_data = {
            **source_data,
            "id": new_plan_id,
            "savedAt": datetime.datetime.now().isoformat(),
            "clonedFrom": {
                "uid": target_user_uid,
                "plan_id": target_plan_id
            }
        }
        
        # Lưu vào Firestore của current_user
        dest_ref = db.collection("users").document(current_user_uid).collection("saved_plans").document(new_plan_id)
        dest_ref.set(new_plan_data)
        
        logger.info(f"User {current_user_uid} đã clone lịch trình {target_plan_id} từ {target_user_uid} thành {new_plan_id}")
        return {"status": "success", "id": new_plan_id, "message": "Đã sao chép lịch trình thành công về tài khoản của bạn."}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi khi clone lịch trình: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sao chép lịch trình thất bại: {str(e)}"
        )

async def list_user_public_plans(uid: str, current_user_uid: Optional[str] = None) -> list:
    """Lấy danh sách các lịch trình công khai (hoặc tất cả nếu là chủ sở hữu)."""
    from app.controllers.user_controller import resolve_uid
    uid = resolve_uid(uid)
    if current_user_uid:
        current_user_uid = resolve_uid(current_user_uid)
    try:
        plans_ref = db.collection("users").document(uid).collection("saved_plans")
        docs = plans_ref.stream()
        plans = []
        is_owner = current_user_uid == uid
        for doc in docs:
            plan_data = doc.to_dict()
            visibility = plan_data.get("visibility", "public") # Mặc định public cho các lịch trình cũ/mock
            if is_owner or visibility == "public":
                plans.append(plan_data)
        
        # Sắp xếp giảm dần theo thời gian lưu
        plans.sort(key=lambda x: x.get("savedAt", ""), reverse=True)
        logger.info(f"Đã lấy {len(plans)} lịch trình cho user {uid} (is_owner={is_owner})")
        return plans
    except Exception as e:
        logger.error(f"Lỗi khi lấy danh sách lịch trình public: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lấy danh sách lịch trình thất bại: {str(e)}"
        )


