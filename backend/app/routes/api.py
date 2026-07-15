from fastapi import APIRouter, Request, Depends
from fastapi.responses import StreamingResponse
from app.controllers.generate_controller import generate_itinerary_stream
from app.controllers.chatbot_controller import ChatRequest, handle_chat
from app.services.firebase_service import verify_firebase_token, verify_firebase_token_optional
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
async def save_user_plan(planData: PlanSaveRequest, decodedToken: dict = Depends(verify_firebase_token)):
    """Lưu lịch trình chuyến đi của người dùng vào Firestore."""
    uid = decodedToken["uid"]
    return await save_plan(uid, planData)

@router.get("/plans/list")
async def list_user_plans(decodedToken: dict = Depends(verify_firebase_token)):
    """Lấy danh sách tất cả các lịch trình đã lưu của người dùng."""
    uid = decodedToken["uid"]
    return await list_plans(uid)

@router.delete("/plans/{planId}")
async def delete_user_plan(planId: str, decodedToken: dict = Depends(verify_firebase_token)):
    """Xóa lịch trình cụ thể của người dùng."""
    uid = decodedToken["uid"]
    return await delete_plan(uid, planId)

from app.controllers.user_controller import UserProfileModel, get_user_profile, get_public_user_profile, update_user_profile, check_username

@router.get("/users/check-username")
async def api_check_username(username: str):
    """Kiểm tra username khả dụng."""
    return await check_username(username)

@router.get("/users/{userId}/profile")
async def get_public_profile(userId: str):
    """Lấy thông tin hồ sơ công khai của người dùng khác từ Firestore."""
    return await get_public_user_profile(userId)


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


# --- Feed, Posts, Hot Search ---
from app.controllers.post_controller import CreatePostRequest, create_post, get_user_posts, update_post, delete_post, get_posts_by_location
from app.controllers.feed_controller import get_personal_feed, get_explore_feed
from app.controllers.hot_search_controller import get_hot_search

@router.post("/posts")
async def api_create_post(postData: CreatePostRequest, decodedToken: dict = Depends(verify_firebase_token)):
    uid = decodedToken["uid"]
    result = await create_post(uid, postData, authorInfo=decodedToken)
    if "error" in result:
        from fastapi import HTTPException
        raise HTTPException(status_code=result.get("status", 500), detail=result["error"])
    return result

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
