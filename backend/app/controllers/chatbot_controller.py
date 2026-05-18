"""
========================================================================
FILE: chatbot_controller.py
CHỨC NĂNG:
- Controller xử lý chat request từ frontend.
- Quản lý các session trò chuyện (mỗi user/tab có session_id riêng).
- Dùng singleton dict để giữ lịch sử chat trong bộ nhớ (in-memory).
========================================================================
"""
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.ai_logic.chatbot import TopGoChatbot

router = APIRouter()

# In-memory session store: { session_id: TopGoChatbot }
_sessions: dict[str, TopGoChatbot] = {}

MAX_SESSIONS = 100  # giới hạn tối đa để tránh memory leak


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"


class ChatResponse(BaseModel):
    reply: str
    session_id: str


def _get_or_create_session(session_id: str) -> TopGoChatbot:
    """Lấy hoặc tạo mới TopGoChatbot session theo session_id."""
    if session_id not in _sessions:
        # Nếu đã đủ MAX_SESSIONS, xóa session cũ nhất (FIFO)
        if len(_sessions) >= MAX_SESSIONS:
            oldest_key = next(iter(_sessions))
            del _sessions[oldest_key]
        _sessions[session_id] = TopGoChatbot()
    return _sessions[session_id]


async def handle_chat(request: ChatRequest) -> ChatResponse:
    """Xử lý tin nhắn chat và trả về phản hồi từ Gemini AI."""
    chatbot = _get_or_create_session(request.session_id)
    reply = chatbot.send_message(request.message)
    return ChatResponse(reply=reply, session_id=request.session_id)
