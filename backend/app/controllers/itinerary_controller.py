import datetime
import logging
from typing import Optional
from pydantic import BaseModel
from fastapi import HTTPException, status
from app.services.firebase_service import db
from firebase_admin import firestore
from fastapi import HTTPException, status

logger = logging.getLogger("app.itinerary_controller")

class ShareItineraryRequest(BaseModel):
    id: str
    destination: str
    days: int
    pax: int
    budget: float
    dateStart: str
    dateEnd: str
    itinerary: str
    visibility: str # 'private', 'unlisted', 'public'
    clonedFrom: Optional[str] = None

async def share_itinerary(uid: str, req: ShareItineraryRequest) -> dict:
    """
    Lưu hoặc cập nhật lịch trình trong collection itineraries.
    - Lần đầu: tạo mới với createdAt = SERVER_TIMESTAMP.
    - Lần sau: chỉ cập nhật dữ liệu + updatedAt, giữ nguyên createdAt gốc.
    """
    try:
        doc_ref = db.collection("itineraries").document(req.id)
        existing = doc_ref.get()

        doc_data = req.dict()
        doc_data["ownerId"] = uid

        if existing.exists:
            # Cập nhật — giữ nguyên createdAt ban đầu, thêm updatedAt
            doc_data["updatedAt"] = firestore.SERVER_TIMESTAMP
            doc_ref.set(doc_data, merge=True)
        else:
            # Tạo mới lần đầu
            doc_data["createdAt"] = firestore.SERVER_TIMESTAMP
            doc_ref.set(doc_data)

        logger.info(f"Đã cập nhật phân quyền lịch trình {req.id} sang {req.visibility} cho user {uid}")
        return {"status": "success", "id": req.id, "visibility": req.visibility}

    except Exception as e:
        logger.error(f"Lỗi share itinerary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cập nhật quyền thất bại: {str(e)}"
        )


async def get_itinerary(itinerary_id: str) -> dict:
    """
    Lấy chi tiết lịch trình được chia sẻ (Public hoặc Unlisted).
    """
    try:
        doc_ref = db.collection("itineraries").document(itinerary_id)
        doc = doc_ref.get()
        if not doc.exists:
            if itinerary_id == "trip-preview-1":
                data = {
                    "id": "trip-preview-1",
                    "destination": "Phú Quốc",
                    "days": 4,
                    "pax": 2,
                    "budget": 8500000.0,
                    "dateStart": "2026-07-20",
                    "dateEnd": "2026-07-24",
                    "itinerary": '{"output":{"Lich_trinh":[[{"Dia_diem":"Bãi Sao"},{"Dia_diem":"Chợ Đêm"}]]}}',
                    "visibility": "public",
                    "ownerId": "mock-admin"
                }
            elif itinerary_id == "trip-preview-2":
                data = {
                    "id": "trip-preview-2",
                    "destination": "Sapa Sương Mù",
                    "days": 3,
                    "pax": 4,
                    "budget": 4500000.0,
                    "dateStart": "2026-11-15",
                    "dateEnd": "2026-11-18",
                    "itinerary": '{"output":{"Lich_trinh":[[{"Dia_diem":"Bản Cát Cát"},{"Dia_diem":"Fansipan"}]]}}',
                    "visibility": "public",
                    "ownerId": "mock-admin"
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Không tìm thấy lịch trình này hoặc đã bị xóa."
                )
        else:
            data = doc.to_dict()

        if data.get("visibility") == "private":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Lịch trình này ở chế độ riêng tư."
            )
        # Convert SERVER_TIMESTAMP (nếu có) để JSON serialize được
        if "createdAt" in data and hasattr(data["createdAt"], "isoformat"):
            data["createdAt"] = data["createdAt"].isoformat()
        return data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi lấy chi tiết lịch trình {itinerary_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi hệ thống: {str(e)}"
        )
