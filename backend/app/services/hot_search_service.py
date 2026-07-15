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
    
    Công thức: score = (likeCount * 1.0 + commentCount * 1.5) / (ageHours + 2)^1.5
    
    - Bài viết mới với nhiều tương tác sẽ có điểm cao.
    - Điểm giảm dần theo thời gian (Time Decay).
    - Hệ số +2 tránh chia cho 0 và làm mượt đường cong.
    """
    try:
        # Parse createdAt — hỗ trợ cả ISO string, timestamp số, và datetime object (Firebase Timestamp)
        if isinstance(createdAt, datetime.datetime):
            postTime = createdAt
        elif isinstance(createdAt, (int, float)):
            postTime = datetime.datetime.fromtimestamp(createdAt, tz=datetime.timezone.utc)
        elif isinstance(createdAt, str):
            # Loại bỏ timezone info nếu có để parse đơn giản
            cleanTime = createdAt.replace("Z", "+00:00")
            try:
                postTime = datetime.datetime.fromisoformat(cleanTime)
            except ValueError:
                postTime = datetime.datetime.now(datetime.timezone.utc)
        else:
            postTime = datetime.datetime.now(datetime.timezone.utc)

        # Đảm bảo timezone-aware
        if postTime.tzinfo is None:
            postTime = postTime.replace(tzinfo=datetime.timezone.utc)

        now = datetime.datetime.now(datetime.timezone.utc)
        ageHours = max((now - postTime).total_seconds() / 3600, 0)

        # Base interaction = 1.0 (so a post itself has value even without likes)
        interactions = 1.0 + (likeCount * 1.0) + (commentCount * 1.5)
        score = interactions / ((ageHours + 2) ** 1.5)

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
        postsRef = db.collection("posts")
        allPosts = postsRef.stream()

        now = datetime.datetime.now(datetime.timezone.utc)
        cutoff72h = now - datetime.timedelta(hours=72)
        
        updatedCount = 0
        topicScores = {}  # {location_tag: total_score}
        topicPostCounts = {}  # {location_tag: count} — đếm inline, tránh stream lần 2
        itin_cache = {}

        for doc in allPosts:
            postData = doc.to_dict()
            if not postData:
                continue

            createdAt = postData.get("createdAt", "")
            
            # Kiểm tra post trong 72h
            try:
                if isinstance(createdAt, datetime.datetime):
                    postTime = createdAt
                elif isinstance(createdAt, str):
                    cleanTime = createdAt.replace("Z", "+00:00")
                    try:
                        postTime = datetime.datetime.fromisoformat(cleanTime)
                    except ValueError:
                        postTime = now
                elif isinstance(createdAt, (int, float)):
                    postTime = datetime.datetime.fromtimestamp(createdAt, tz=datetime.timezone.utc)
                else:
                    postTime = now

                if postTime.tzinfo is None:
                    postTime = postTime.replace(tzinfo=datetime.timezone.utc)

                if postTime < cutoff72h:
                    continue  # Bỏ qua bài cũ hơn 72h
            except Exception:
                continue

            # Tính hotScore mới
            likeCount = postData.get("likeCount", 0)
            commentCount = postData.get("commentCount", 0)
            newScore = calculate_hot_score(likeCount, commentCount, createdAt)

            # Cập nhật hotScore vào Firestore
            postRef = db.collection("posts").document(doc.id)
            postRef.set({"hotScore": newScore}, merge=True)
            updatedCount += 1

            # Tổng hợp taggedLocations — đếm inline để tránh stream lần 2
            taggedLocations = postData.get("taggedLocations", [])
            if not isinstance(taggedLocations, list):
                taggedLocations = []
            else:
                taggedLocations = list(taggedLocations)
            
            # Khai thác location từ lịch trình đính kèm
            itineraryId = postData.get("itineraryId")
            if itineraryId:
                if itineraryId not in itin_cache:
                    try:
                        itinDoc = db.collection("itineraries").document(itineraryId).get()
                        if itinDoc.exists:
                            itinData = itinDoc.to_dict()
                            itin_cache[itineraryId] = itinData.get("destination")
                        else:
                            itin_cache[itineraryId] = None
                    except Exception as e:
                        logger.warning(f"Lỗi truy xuất itinerary {itineraryId}: {e}")
                        itin_cache[itineraryId] = None
                
                itinDest = itin_cache.get(itineraryId)
                if itinDest and itinDest not in taggedLocations:
                    taggedLocations.append(itinDest)

            for location in taggedLocations:
                if location:
                    topicScores[location] = topicScores.get(location, 0) + newScore
                    topicPostCounts[location] = topicPostCounts.get(location, 0) + 1

        # Ghi hot_topics vào Firestore (dùng postCount đã đếm inline)
        for topic, score in topicScores.items():
            topicId = topic.lower().replace(" ", "_").replace("-", "_")
            topicRef = db.collection("hot_topics").document(topicId)
            topicRef.set({
                "name": topic,
                "score": round(score, 4),
                "postCount": topicPostCounts.get(topic, 0),
                "updatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
            })

        logger.info(f"✅ [Hot Search] Đã cập nhật {updatedCount} bài viết, {len(topicScores)} chủ đề hot.")


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
        topicsRef = db.collection("hot_topics")
        allTopics = topicsRef.stream()

        topics = []
        for doc in allTopics:
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
