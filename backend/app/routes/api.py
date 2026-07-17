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

from app.controllers.reviews_controller import get_google_reviews

# ════════════════════════════════════════════════════════════════════
# PAYMENT — VNPay
# ════════════════════════════════════════════════════════════════════
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

# ----------------- TÍNH NĂNG CỦA BÍCH DIỆP -----------------
from app.controllers.itinerary_controller import ShareItineraryRequest, share_itinerary, get_itinerary
from app.controllers.post_controller import CreatePostRequest, create_post

@router.post("/itineraries/share")
async def share_user_itinerary(req: ShareItineraryRequest, decoded_token: dict = Depends(verify_firebase_token)):
    """API lưu và phân quyền chia sẻ lịch trình (Private, Unlisted, Public)."""
    uid = decoded_token["uid"]
    return await share_itinerary(uid, req)

@router.get("/itineraries/{itinerary_id}")
async def get_shared_itinerary(itinerary_id: str):
    """API công khai lấy chi tiết lịch trình được chia sẻ (Public/Unlisted)."""
    return await get_itinerary(itinerary_id)

@router.post("/posts/create")
async def create_user_post(req: CreatePostRequest, decoded_token: dict = Depends(verify_firebase_token)):
    """API đăng bài lên News Feed (kèm ảnh và lịch trình). Chứa AI kiểm duyệt."""
    uid = decoded_token["uid"]
    return await create_post(uid, req)
@router.get("/google-reviews")
async def google_reviews(place_name: str, city_name: str = ""):
    """Lấy reviews từ Google Maps qua SerpAPI (lazy-load, có cache)."""
    return await get_google_reviews(place_name, city_name)
# ════════════════════════════════════════════════════════════════════
# POSTS — Hệ thống bài đăng mạng xã hội
# ════════════════════════════════════════════════════════════════════
from app.controllers.post_controller import (
    CommentCreateRequest, RepostCreateRequest,
    create_post,
    toggle_like, get_user_like_status, add_comment, list_comments,
    create_repost
)

def _build_author_info(decoded_token: dict) -> dict:
    """Trích xuất thông tin tác giả từ Firebase token."""
    return {
        "authorName": decoded_token.get("name") or decoded_token.get("email", "Ẩn danh"),
        "authorAvatar": decoded_token.get("picture", ""),
    }






@router.post("/posts/{post_id}/like")
async def like_post(post_id: str, decoded_token: dict = Depends(verify_firebase_token)):
    """Toggle like/unlike bài đăng. Like lưu vào collection `likes` với ID = {postId}_{userId}."""
    uid = decoded_token["uid"]
    return await toggle_like(uid, post_id)

@router.get("/posts/{post_id}/like-status")
async def check_like_status(post_id: str, decoded_token: dict = Depends(verify_firebase_token)):
    """Kiểm tra user hiện tại đã like bài đăng này chưa."""
    uid = decoded_token["uid"]
    liked = await get_user_like_status(uid, post_id)
    return {"liked": liked, "postId": post_id}

@router.get("/posts/{post_id}/comments")
async def get_post_comments(post_id: str):
    """Lấy danh sách bình luận của bài đăng (từ top-level collection `comments`)."""
    return await list_comments(post_id)

@router.post("/posts/{post_id}/comments")
async def add_post_comment(post_id: str, data: CommentCreateRequest, decoded_token: dict = Depends(verify_firebase_token)):
    """Thêm bình luận vào bài đăng. Yêu cầu đăng nhập."""
    uid = decoded_token["uid"]
    return await add_comment(uid, _build_author_info(decoded_token), post_id, data)

@router.post("/posts/{post_id}/repost")
async def repost_post(post_id: str, data: RepostCreateRequest, decoded_token: dict = Depends(verify_firebase_token)):
    """Chia sẻ lại bài đăng (trích dẫn kiểu Twitter). Yêu cầu đăng nhập."""
    uid = decoded_token["uid"]
    return await create_repost(uid, _build_author_info(decoded_token), post_id, data)


# ════════════════════════════════════════════════════════════════════
# ITINERARIES — Alias URL + Clone (IDOR protected)
# ════════════════════════════════════════════════════════════════════

@router.get("/itineraries/{plan_id}")
async def get_itinerary_public(
    plan_id: str,
    itinerary: dict = Depends(verify_itinerary_access),
):
    """
    [Alias] Lấy thông tin lịch trình theo ID — bảo vệ bởi IDOR Middleware.
    (Route chính tương đương: GET /api/plans/{plan_id})
    - visibility == 'public'  → 200 cho tất cả
    - visibility == 'private' + không có token hợp lệ → 401
    - visibility == 'private' + uid không khớp ownerId → 403
    - visibility == 'private' + uid khớp ownerId → 200
    """
    return itinerary


