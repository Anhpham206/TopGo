from fastapi import APIRouter, Request, Depends
from fastapi.responses import StreamingResponse
from app.controllers.generate_controller import generate_itinerary_stream
from app.controllers.chatbot_controller import ChatRequest, handle_chat
from app.services.firebase_service import verify_firebase_token
from app.controllers.saved_plans_controller import PlanSaveRequest, save_plan, list_plans, delete_plan

router = APIRouter()

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

@router.delete("/plans/{plan_id}")
async def delete_user_plan(plan_id: str, decoded_token: dict = Depends(verify_firebase_token)):
    """Xóa lịch trình cụ thể của người dùng."""
    uid = decoded_token["uid"]
    return await delete_plan(uid, plan_id)

from app.controllers.user_controller import (
    UserProfileModel, get_user_profile, update_user_profile,
    follow_user, unfollow_user, check_follow_status, get_follow_counts,
    get_public_profile, get_user_posts_stub
)

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

@router.post("/users/{uid}/follow")
async def follow(uid: str, decoded_token: dict = Depends(verify_firebase_token)):
    """Theo dõi người dùng."""
    current_uid = decoded_token["uid"]
    return await follow_user(current_uid, uid)

@router.post("/users/{uid}/unfollow")
async def unfollow(uid: str, decoded_token: dict = Depends(verify_firebase_token)):
    """Hủy theo dõi người dùng."""
    current_uid = decoded_token["uid"]
    return await unfollow_user(current_uid, uid)

@router.get("/users/{uid}/follow-status")
async def follow_status(uid: str, decoded_token: dict = Depends(verify_firebase_token)):
    """Kiểm tra xem người dùng hiện tại đã follow uid hay chưa."""
    current_uid = decoded_token["uid"]
    is_following = await check_follow_status(current_uid, uid)
    return {"is_following": is_following}

@router.get("/users/{uid}/network-count")
async def network_count(uid: str):
    """Lấy số lượng người theo dõi và đang theo dõi của người dùng."""
    return await get_follow_counts(uid)

@router.get("/users/{uid}/public-profile")
async def public_profile(uid: str, request: Request):
    """Lấy thông tin trang cá nhân công khai."""
    auth_header = request.headers.get("Authorization")
    current_user_uid = None
    if auth_header:
        try:
            # Giải mã token thủ công để lấy uid người dùng hiện tại (nếu có)
            decoded_token = await verify_firebase_token(auth_header)
            current_user_uid = decoded_token["uid"]
        except Exception:
            pass
    return await get_public_profile(uid, current_user_uid)

@router.get("/users/{uid}/posts")
async def get_user_posts(uid: str):
    """Lấy danh sách bài viết công khai của người dùng (stub)."""
    return await get_user_posts_stub(uid)

from app.controllers.saved_plans_controller import get_plan, clone_plan, list_user_public_plans

@router.get("/users/{uid}/plans")
async def get_user_plans(uid: str, request: Request):
    """Lấy danh sách lịch trình công khai (hoặc tất cả nếu là chủ sở hữu)."""
    auth_header = request.headers.get("Authorization")
    current_user_uid = None
    if auth_header:
        try:
            decoded_token = await verify_firebase_token(auth_header)
            current_user_uid = decoded_token["uid"]
        except Exception:
            pass
    return await list_user_public_plans(uid, current_user_uid)

@router.get("/users/{uid}/plans/{plan_id}")
async def get_user_plan_details(uid: str, plan_id: str, decoded_token: dict = Depends(verify_firebase_token)):
    """Lấy chi tiết một lịch trình cụ thể của người dùng."""
    # Sẽ có middleware bảo mật chặn IDOR do Thư viết sau này ở đây.
    return await get_plan(uid, plan_id)


@router.post("/plans/{plan_id}/clone")
async def clone_user_plan(plan_id: str, target_uid: str, decoded_token: dict = Depends(verify_firebase_token)):
    """Nhân bản lịch trình của người dùng khác về tài khoản của người dùng hiện tại."""
    current_uid = decoded_token["uid"]
    return await clone_plan(current_uid, target_uid, plan_id)


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


