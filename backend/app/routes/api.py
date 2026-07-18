from fastapi import APIRouter, Request, Depends
from fastapi.responses import StreamingResponse
from app.controllers.generate_controller import generate_itinerary_stream
from app.controllers.chatbot_controller import ChatRequest, handle_chat
from app.services.firebase_service import verify_firebase_token, verify_firebase_token_optional
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
async def save_user_plan(planData: PlanSaveRequest, decodedToken: dict = Depends(verify_firebase_token)):
    """Lưu lịch trình chuyến đi của người dùng vào Firestore."""
    uid = decodedToken["uid"]
    return await save_plan(uid, planData)

@router.get("/plans/list")
async def list_user_plans(decodedToken: dict = Depends(verify_firebase_token)):
    """Lấy danh sách tất cả các lịch trình đã lưu của người dùng."""
    uid = decodedToken["uid"]
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

from app.controllers.user_controller import UserProfileModel, get_user_profile, get_public_user_profile, update_user_profile, check_username

@router.get("/users/check-username")
async def api_check_username(username: str):
    """Kiểm tra username khả dụng."""
    return await check_username(username)

@router.get("/users/{userId}/profile")
async def get_public_profile(userId: str):
    """Lấy thông tin hồ sơ công khai của người dùng khác từ Firestore."""
    return await get_public_user_profile(userId)


# ════════════════════════════════════════════════════════════════════
# USERS — Hồ sơ người dùng
# ════════════════════════════════════════════════════════════════════

@router.get("/users/profile")
async def get_profile(decodedToken: dict = Depends(verify_firebase_token)):
    """Lấy thông tin hồ sơ người dùng từ Firestore."""
    uid = decodedToken["uid"]
    return await get_user_profile(uid)

@router.post("/users/profile")
async def update_profile(profileData: UserProfileModel, decodedToken: dict = Depends(verify_firebase_token)):
    """Cập nhật thông tin hồ sơ người dùng lên Firestore."""
    uid = decodedToken["uid"]
    return await update_user_profile(uid, profileData)

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

# --- Feed, Posts, Hot Search ---
from app.controllers.post_controller import  get_user_posts, update_post, delete_post, get_posts_by_location
from app.controllers.feed_controller import get_personal_feed, get_explore_feed
from app.controllers.hot_search_controller import get_hot_search


@router.put("/posts/{postId}")
async def api_update_post(postId: str, postData: CreatePostRequest, decodedToken: dict = Depends(verify_firebase_token)):
    uid = decodedToken["uid"]
    result = await update_post(uid, postId, postData)
    if "error" in result:
        from fastapi import HTTPException
        raise HTTPException(status_code=result.get("status", 500), detail=result["error"])
    return result

@router.delete("/posts/{postId}")
async def api_delete_post(postId: str, decodedToken: dict = Depends(verify_firebase_token)):
    uid = decodedToken["uid"]
    result = await delete_post(uid, postId)
    if "error" in result:
        from fastapi import HTTPException
        raise HTTPException(status_code=result.get("status", 500), detail=result["error"])
    return result


@router.get("/users/profile/posts")
async def api_get_user_posts(decodedToken: dict = Depends(verify_firebase_token)):
    uid = decodedToken["uid"]
    return await get_user_posts(uid)

@router.get("/users/{userId}/posts")
async def api_get_other_user_posts(userId: str):
    """Lấy danh sách bài đăng của một tài khoản cụ thể bằng userId (Public)."""
    return await get_user_posts(userId)

@router.get("/locations/{location_name}/posts")
async def api_get_location_posts(location_name: str):
    """Lấy danh sách bài đăng được gắn thẻ địa điểm cụ thể (Public)."""
    return await get_posts_by_location(location_name)


@router.get("/feed/{tab}")
async def api_get_feed(tab: str, cursor: str = None, limit: int = 10, decodedToken: dict = Depends(verify_firebase_token_optional)):
    uid = decodedToken.get("uid")
    if tab == "explore":
        return await get_explore_feed(uid, limit, cursor)
    else:
        from fastapi import HTTPException
        if not uid:
            raise HTTPException(status_code=401, detail="Bạn cần đăng nhập để xem bảng tin đang theo dõi.")
        return await get_personal_feed(uid, limit, cursor)

@router.get("/hot-search")
async def api_get_hot_search(limit: int = 10):
    return await get_hot_search(limit)

from app.controllers.search_controller import perform_search

@router.get("/search")
async def api_search(q: str, limit: int = 10):
    return await perform_search(q, limit)

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

from pydantic import BaseModel
class CreateReviewRequest(BaseModel):
    location_id: str
    rating: int
    comment: str

@router.post("/reviews/create")
async def create_user_review(req: CreateReviewRequest, decoded_token: dict = Depends(verify_firebase_token)):
    """API lưu review qua backend, bypass Firestore Client Security Rules."""
    uid = decoded_token["uid"]
    author_info = _build_author_info(decoded_token)
    
    from app.services.firebase import db
    from firebase_admin import firestore
    
    review_data = {
        "location_id": req.location_id,
        "user_id": uid,
        "user_name": author_info["authorName"],
        "rating": req.rating,
        "comment": req.comment,
        "timestamp": firestore.SERVER_TIMESTAMP
    }
    
    db.collection("Reviews").add(review_data)
    return {"message": "Review added successfully", "status": "success"}

# ════════════════════════════════════════════════════════════════════
# POSTS — Hệ thống bài đăng mạng xã hội
# ════════════════════════════════════════════════════════════════════
from app.controllers.post_controller import (
    CommentCreateRequest, RepostCreateRequest,
    create_post, get_post,
    toggle_like, get_user_like_status, add_comment, list_comments,
    create_repost
)

def _build_author_info(decoded_token: dict) -> dict:
    """Trích xuất thông tin tác giả từ Firebase token."""
    return {
        "authorName": decoded_token.get("name") or decoded_token.get("email", "Ẩn danh"),
        "authorAvatar": decoded_token.get("picture", ""),
    }

@router.get("/posts/{post_id}")
async def get_single_post(post_id: str):
    """Lấy chi tiết một bài viết."""
    return await get_post(post_id)

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


