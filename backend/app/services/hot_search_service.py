"""
========================================================================
FILE: hot_search_service.py
CHỨC NĂNG:
- Thuật toán Time Decay tính điểm hotScore cho bài viết.
- Background scheduler chạy mỗi 15 phút để cập nhật hotScore.
- Tổng hợp các taggedLocations thành hot_topics collection.
========================================================================
"""

import asyncio
import logging
import datetime
from app.services.firebase_service import db

logger = logging.getLogger("app.hot_search_service")

# =========================================================================
# THUẬT TOÁN TIME DECAY
# =========================================================================

def calculate_hot_score(likeCount: int, commentCount: int, createdAt: str) -> float:
    """
    Tính điểm hotScore cho bài viết dựa trên tương tác và thời gian.
    
    Công thức: score = (likeCount * 1.0 + commentCount * 1.5) / (age_hours + 2)^1.5
    
    - Bài viết mới với nhiều tương tác sẽ có điểm cao.
    - Điểm giảm dần theo thời gian (Time Decay).
    - Hệ số +2 tránh chia cho 0 và làm mượt đường cong.
    """
    try:
        # Parse createdAt — hỗ trợ cả ISO string lẫn timestamp
        if isinstance(createdAt, (int, float)):
            post_time = datetime.datetime.fromtimestamp(createdAt, tz=datetime.timezone.utc)
        elif isinstance(createdAt, str):
            # Loại bỏ timezone info nếu có để parse đơn giản
            clean_time = createdAt.replace("Z", "+00:00")
            try:
                post_time = datetime.datetime.fromisoformat(clean_time)
            except ValueError:
                post_time = datetime.datetime.now(datetime.timezone.utc)
        else:
            post_time = datetime.datetime.now(datetime.timezone.utc)

        # Đảm bảo timezone-aware
        if post_time.tzinfo is None:
            post_time = post_time.replace(tzinfo=datetime.timezone.utc)

        now = datetime.datetime.now(datetime.timezone.utc)
        age_hours = max((now - post_time).total_seconds() / 3600, 0)

        interactions = (likeCount * 1.0) + (commentCount * 1.5)
        score = interactions / ((age_hours + 2) ** 1.5)

        return round(score, 4)

    except Exception as e:
        logger.warning(f"Lỗi tính hotScore: {e}")
        return 0.0


# =========================================================================
# CẬP NHẬT HOT SCORE CHO TẤT CẢ BÀI VIẾT
# =========================================================================

def run_hot_score_update():
    """
    Quét tất cả bài viết trong 72 giờ gần nhất và cập nhật hotScore.
    Đồng thời tổng hợp taggedLocations thành hot_topics.
    """
    try:
        logger.info("🔄 [Hot Search] Bắt đầu cập nhật hotScore...")

        # Lấy tất cả posts
        posts_ref = db.collection("posts")
        all_posts = posts_ref.stream()

        now = datetime.datetime.now(datetime.timezone.utc)
        cutoff_72h = now - datetime.timedelta(hours=72)
        
        updated_count = 0
        topic_scores = {}  # {location_tag: total_score}

        for doc in all_posts:
            post_data = doc.to_dict()
            if not post_data:
                continue

            created_at = post_data.get("createdAt", "")
            
            # Kiểm tra post trong 72h
            try:
                if isinstance(created_at, str):
                    clean_time = created_at.replace("Z", "+00:00")
                    try:
                        post_time = datetime.datetime.fromisoformat(clean_time)
                    except ValueError:
                        post_time = now
                elif isinstance(created_at, (int, float)):
                    post_time = datetime.datetime.fromtimestamp(created_at, tz=datetime.timezone.utc)
                else:
                    post_time = now

                if post_time.tzinfo is None:
                    post_time = post_time.replace(tzinfo=datetime.timezone.utc)

                if post_time < cutoff_72h:
                    continue  # Bỏ qua bài cũ hơn 72h
            except Exception:
                continue

            # Tính hotScore mới
            like_count = post_data.get("likeCount", 0)
            comment_count = post_data.get("commentCount", 0)
            new_score = calculate_hot_score(like_count, comment_count, created_at)

            # Cập nhật hotScore vào Firestore
            post_ref = db.collection("posts").document(doc.id)
            post_ref.set({"hotScore": new_score}, merge=True)
            updated_count += 1

            # Tổng hợp taggedLocations
            tagged_locations = post_data.get("taggedLocations", [])
            for location in tagged_locations:
                if location:
                    topic_scores[location] = topic_scores.get(location, 0) + new_score

        # Ghi hot_topics vào Firestore
        for topic, score in topic_scores.items():
            topic_id = topic.lower().replace(" ", "_").replace("-", "_")
            topic_ref = db.collection("hot_topics").document(topic_id)
            topic_ref.set({
                "name": topic,
                "score": round(score, 4),
                "postCount": sum(
                    1 for doc in db.collection("posts").stream()
                    if topic in (doc.to_dict() or {}).get("taggedLocations", [])
                ),
                "updatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
            })

        logger.info(f"✅ [Hot Search] Đã cập nhật {updated_count} bài viết, {len(topic_scores)} chủ đề hot.")

    except Exception as e:
        logger.error(f"❌ [Hot Search] Lỗi cập nhật hotScore: {e}")


# =========================================================================
# LẤY DANH SÁCH CHỦ ĐỀ HOT
# =========================================================================

def get_hot_topics(limit: int = 10) -> list:
    """
    Lấy danh sách chủ đề hot, sắp xếp theo score giảm dần.
    """
    try:
        topics_ref = db.collection("hot_topics")
        all_topics = topics_ref.stream()

        topics = []
        for doc in all_topics:
            data = doc.to_dict()
            if data:
                data["id"] = doc.id
                topics.append(data)

        # Sắp xếp theo score giảm dần
        topics.sort(key=lambda x: x.get("score", 0), reverse=True)
        return topics[:limit]

    except Exception as e:
        logger.error(f"Lỗi lấy hot topics: {e}")
        return []


# =========================================================================
# BACKGROUND SCHEDULER — CHẠY MỖI 15 PHÚT
# =========================================================================

async def hot_score_scheduler():
    """
    Asyncio task chạy vô hạn, gọi run_hot_score_update() mỗi 15 phút.
    Được khởi tạo trong FastAPI lifespan event.
    """
    logger.info("🚀 [Hot Search] Background scheduler đã khởi động. Cập nhật mỗi 15 phút.")
    
    # Chạy lần đầu ngay khi server boot
    await asyncio.to_thread(run_hot_score_update)

    while True:
        try:
            await asyncio.sleep(15 * 60)  # 15 phút
            await asyncio.to_thread(run_hot_score_update)
        except asyncio.CancelledError:
            logger.info("🛑 [Hot Search] Background scheduler đã dừng.")
            break
        except Exception as e:
            logger.error(f"❌ [Hot Search] Lỗi scheduler: {e}")
            await asyncio.sleep(60)  # Chờ 1 phút rồi thử lại
