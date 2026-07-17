"""
========================================================================
FILE: idor_middleware.py
CHỨC NĂNG:
- FastAPI Dependency độc lập bảo vệ các endpoint liên quan đến lịch trình.
- Chặn truy cập IDOR (Insecure Direct Object Reference):
    + Nếu lịch trình Public → cho phép mọi người truy cập.
    + Nếu lịch trình Private + không có token → 401 Unauthorized.
    + Nếu lịch trình Private + token hợp lệ nhưng uid không khớp ownerId → 403 Forbidden.
    + Nếu lịch trình Private + token hợp lệ VÀ uid khớp ownerId → 200 OK.
- Truy vấn trực tiếp collection `itineraries` trên Firestore.
- Kiểm tra field `ownerId` (camelCase) để xác định chủ sở hữu lịch trình.
  (Lưu ý: itineraries dùng ownerId, posts dùng authorId — theo schema chính thức)
========================================================================
"""
import logging
from typing import Optional

from fastapi import Header, HTTPException, Path, status

from app.services.firebase_service import auth, db

logger = logging.getLogger("app.idor_middleware")


async def _resolve_uid_from_header(authorization: Optional[str]) -> Optional[str]:
    """
    Cố gắng giải mã Firebase ID Token từ Authorization header.
    Trả về uid nếu token hợp lệ, hoặc None nếu không có / không hợp lệ.
    Không raise exception — caller quyết định xử lý None.
    """
    if not authorization:
        return None
    try:
        parts = authorization.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None
        token = parts[1]
        decoded = auth.verify_id_token(token)
        return decoded.get("uid")
    except Exception:
        return None


async def verify_itinerary_access(
    plan_id: str = Path(..., description="ID của lịch trình cần truy cập"),
    authorization: Optional[str] = Header(None),
) -> dict:
    """
    FastAPI Dependency — Bảo vệ endpoint truy cập lịch trình khỏi tấn công IDOR.

    Logic kiểm tra:
      1. Truy vấn lịch trình từ collection `itineraries` theo plan_id.
      2. Nếu `visibility == 'public'` → trả về dữ liệu ngay, không cần token.
      3. Nếu `visibility == 'private'`:
         a. Không có token hoặc token không hợp lệ → 401 Unauthorized.
         b. uid giải mã từ token không khớp `ownerId` → 403 Forbidden.
         c. uid khớp `ownerId` → trả về dữ liệu, cho phép truy cập.

    Cách dùng trong route:
        @router.get("/itineraries/{plan_id}")
        async def get_itinerary(
            itinerary: dict = Depends(verify_itinerary_access)
        ):
            return itinerary

    Trả về: dict dữ liệu lịch trình nếu được phép truy cập.
    Raise HTTPException nếu bị từ chối.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firebase Admin SDK chưa được cấu hình.",
        )

    # ── Bước 1: Truy vấn lịch trình từ Firestore ───────────────────────────
    try:
        doc_ref = db.collection("itineraries").document(plan_id)
        doc = doc_ref.get()
    except Exception as e:
        logger.error(f"[IDOR] Lỗi khi truy vấn Firestore cho itinerary {plan_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lỗi máy chủ khi kiểm tra quyền truy cập lịch trình.",
        )

    if not doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy lịch trình với mã '{plan_id}'.",
        )

    itinerary_data = doc.to_dict()
    visibility = itinerary_data.get("visibility", "public").lower()

    # ── Bước 2: Lịch trình Public → cho phép tất cả ───────────────────────
    if visibility == "public":
        logger.info(f"[IDOR] Truy cập Public itinerary {plan_id} — GRANTED")
        return itinerary_data

    # ── Bước 3: Lịch trình Private → kiểm tra token ───────────────────────
    uid = await _resolve_uid_from_header(authorization)

    if uid is None:
        # Không có token hoặc token không hợp lệ
        logger.warning(
            f"[IDOR] Truy cập bị chặn (Private, không có token hợp lệ) — itinerary {plan_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Lịch trình này ở chế độ riêng tư. Vui lòng đăng nhập để tiếp tục.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ── Bước 4: So sánh ownerId với uid của requester ──────────────────────
    # itineraries dùng ownerId (không phải authorId) — theo schema chính thức
    owner_id = itinerary_data.get("ownerId")  # Bắt buộc camelCase: ownerId

    if owner_id != uid:
        logger.warning(
            f"[IDOR] Truy cập bị chặn (Private, sai chủ sở hữu) — "
            f"itinerary {plan_id}, ownerId={owner_id}, requester uid={uid}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền xem lịch trình riêng tư này.",
        )

    # ── Bước 5: Chủ sở hữu hợp lệ → cho phép ────────────────────────────
    logger.info(
        f"[IDOR] Truy cập Private itinerary {plan_id} bởi chủ sở hữu {uid} (ownerId khớp) — GRANTED"
    )
    return itinerary_data
