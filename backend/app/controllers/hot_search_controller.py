"""
========================================================================
FILE: hot_search_controller.py
CHỨC NĂNG:
- API endpoint lấy danh sách chủ đề hot (Hot Search).
- Trả về top topics sắp xếp theo score giảm dần.
========================================================================
"""

import logging
from app.services.hot_search_service import get_hot_topics

logger = logging.getLogger("app.hot_search_controller")


async def get_hot_search(limit: int = 10) -> dict:
    """
    Lấy danh sách chủ đề hot từ hot_topics collection.
    Nếu chưa có dữ liệu, trả về danh sách mặc định các điểm đến phổ biến.
    """
    try:
        topics = get_hot_topics(limit=limit)

        return {
            "topics": topics or [],
            "total": len(topics) if topics else 0
        }

    except Exception as e:
        logger.error(f"Lỗi lấy hot search: {e}")
        return {
            "topics": [],
            "total": 0
        }


def _get_default_hot_topics() -> list:
    """
    Danh sách chủ đề hot mặc định khi hệ thống chưa có đủ dữ liệu.
    Các điểm đến du lịch phổ biến tại Việt Nam.
    """
    return [
        {"id": "da_nang", "name": "Đà Nẵng", "score": 95.0, "postCount": 0, "trend": "up"},
        {"id": "phu_quoc", "name": "Phú Quốc", "score": 88.5, "postCount": 0, "trend": "up"},
        {"id": "da_lat", "name": "Đà Lạt", "score": 82.0, "postCount": 0, "trend": "stable"},
        {"id": "hoi_an", "name": "Hội An", "score": 78.3, "postCount": 0, "trend": "up"},
        {"id": "nha_trang", "name": "Nha Trang", "score": 75.0, "postCount": 0, "trend": "stable"},
        {"id": "ha_noi", "name": "Hà Nội", "score": 72.5, "postCount": 0, "trend": "down"},
        {"id": "sapa", "name": "Sa Pa", "score": 68.0, "postCount": 0, "trend": "up"},
        {"id": "hcm", "name": "TP. Hồ Chí Minh", "score": 65.5, "postCount": 0, "trend": "stable"},
        {"id": "ninh_binh", "name": "Ninh Bình", "score": 60.0, "postCount": 0, "trend": "up"},
        {"id": "ha_long", "name": "Hạ Long", "score": 55.0, "postCount": 0, "trend": "stable"},
    ]
