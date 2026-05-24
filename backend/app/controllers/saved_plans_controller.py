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
