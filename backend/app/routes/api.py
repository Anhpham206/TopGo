from fastapi import APIRouter, Request, Depends
from fastapi.responses import StreamingResponse
from app.controllers.generate_controller import generate_itinerary_stream
from app.controllers.chatbot_controller import ChatRequest, handle_chat
from app.services.firebase_service import verify_firebase_token
from app.controllers.saved_plans_controller import PlanSaveRequest, save_plan, list_plans, delete_plan
from app.services.idor_middleware import verify_itinerary_access

router = APIRouter()

# ════════════════════════════════════════════════════════════════════
# AI — Generate & Chat
# ════════════════════════════════════════════════════════════════════

@router.post("/generate")
async def generate(request: Request):
    payload = await request.json()
    return StreamingResponse(
        generate_itinerary_stream(payload),
        media_type="application/x-ndjson"
    )

@router.post("/chat")
async def chat(request: ChatRequest):
    """Endpoint chat với TopGo AI — nhận message, trả về reply từ Gemini."""
    return await handle_chat(request)


# ════════════════════════════════════════════════════════════════════
# PLANS / ITINERARIES — Lịch trình du lịch
# ════════════════════════════════════════════════════════════════════

@router.post("/plans/save")
async def save_user_plan(plan_data: PlanSaveRequest, decoded_token: dict = Depends(verify_firebase_token)):
    """Lưu lịch trình chuyến đi của người dùng vào Firestore."""
    uid = decoded_token["uid"]
    return await save_plan(uid, plan_data)

@router.get("/plans/list")
async def list_user_plans(decoded_token: dict = Depends(verify_firebase_token)):
    """Lấy danh sách tất cả các lịch trình đã lưu của người dùng."""
    uid = decoded_token["uid"]
    return await list_plans(uid)

@router.get("/plans/{plan_id}")
async def get_plan_detail(
    plan_id: str,
    itinerary: dict = Depends(verify_itinerary_access),
):
    """
    Lấy chi tiết một lịch trình theo ID. Được bảo vệ bởi IDOR Middleware.

    Logic kiểm tra (thực hiện bởi verify_itinerary_access):
    - visibility == 'public'  → 200 cho tất cả, không cần token
    - visibility == 'private' + không có token hợp lệ → 401 Unauthorized
    - visibility == 'private' + uid không khớp ownerId → 403 Forbidden
    - visibility == 'private' + uid khớp ownerId → 200 OK
    """
    return itinerary

@router.delete("/plans/{plan_id}")
async def delete_user_plan(plan_id: str, decoded_token: dict = Depends(verify_firebase_token)):
    """Xóa lịch trình cụ thể của người dùng."""
    uid = decoded_token["uid"]
    return await delete_plan(uid, plan_id)


# ════════════════════════════════════════════════════════════════════
# USERS — Hồ sơ người dùng
# ════════════════════════════════════════════════════════════════════
from app.controllers.user_controller import UserProfileModel, get_user_profile, update_user_profile

@router.get("/users/profile")
async def get_profile(decoded_token: dict = Depends(verify_firebase_token)):
    """Lấy thông tin hồ sơ người dùng từ Firestore."""
    uid = decoded_token["uid"]
    return await get_user_profile(uid)

@router.post("/users/profile")
async def update_profile(profile_data: UserProfileModel, decoded_token: dict = Depends(verify_firebase_token)):
    """Cập nhật thông tin hồ sơ người dùng lên Firestore."""
    uid = decoded_token["uid"]
    return await update_user_profile(uid, profile_data)

from app.controllers.reviews_controller import get_google_reviews
from app.controllers.payment_controller import CreatePaymentRequest, create_payment_url, handle_payment_return, handle_payment_ipn

@router.post("/payment/vnpay_create")
async def vnpay_create(req: CreatePaymentRequest, decoded_token: dict = Depends(verify_firebase_token), request: Request = None):
    """Tạo liên kết thanh toán VNPay."""
    return await create_payment_url(req, decoded_token, request)

@router.get("/payment/vnpay_return")
async def vnpay_return(request: Request):
    """Nhận kết quả thanh toán từ VNPay và cập nhật VIP."""
    return await handle_payment_return(request)

@router.get("/payment/vnpay_ipn")
async def vnpay_ipn(request: Request):
    """Webhook IPN tự động từ VNPay server."""
    return await handle_payment_ipn(request)


@router.get("/google-reviews")
async def google_reviews(place_name: str, city_name: str = ""):
    """Lấy reviews từ Google Maps qua SerpAPI (lazy-load, có cache)."""
    return await get_google_reviews(place_name, city_name)
