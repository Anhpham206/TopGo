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


