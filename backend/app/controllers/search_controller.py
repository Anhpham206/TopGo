import logging
from fastapi import HTTPException
from app.services.firebase_service import db

logger = logging.getLogger("app.search_controller")

async def perform_search(query: str, limit: int = 10) -> dict:
    if not query or len(query.strip()) < 2:
        return {"users": [], "posts": [], "locations": []}
        
    query_lower = query.strip().lower()
    
    users_result = []
    posts_result = []
    unique_locations = set()
    
    try:
        # Search users (naive search on mock firestore)
        users_ref = db.collection("users").get()
        for doc in users_ref:
            data = doc.to_dict()
            username = data.get("username", "").lower()
            fname = data.get("firstname", "").lower()
            lname = data.get("lastname", "").lower()
            fullname = f"{lname} {fname}".strip()
            
            if query_lower in username or query_lower in fullname:
                users_result.append({
                    "id": doc.id,
                    "username": data.get("username", ""),
                    "fullname": fullname or data.get("displayName", "User"),
                    "photoURL": data.get("photoURL", "")
                })
                
        # Search posts (naive search on mock firestore)
        posts_ref = db.collection("posts").order_by("createdAt", direction="DESCENDING").get()
        for doc in posts_ref:
            data = doc.to_dict()
            content = data.get("content", "").lower()
            tagged_locations_raw = data.get("taggedLocations", [])
            
            is_post_match = False
            # Check content
            if query_lower in content:
                is_post_match = True
                
            # Check tagged locations and collect unique locations
            for loc in tagged_locations_raw:
                if query_lower in loc.lower():
                    unique_locations.add(loc)
                    is_post_match = True
                    
            if is_post_match:
                posts_result.append({
                    "id": doc.id,
                    "content": data.get("content", ""),
                    "authorName": data.get("authorName", ""),
                    "authorPhotoUrl": data.get("authorPhotoUrl", ""),
                    "mediaUrls": data.get("mediaUrls", []),
                    "createdAt": data.get("createdAt", "")
                })

        # Add predefined popular locations if they match the query to ensure search works smoothly
        popular_locations = [
            "Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Đà Lạt", "Nha Trang", 
            "Hội An", "Phú Quốc", "Sa Pa", "Vũng Tàu", "Hạ Long", "Ninh Bình",
            "Huế", "Quy Nhơn", "Mũi Né", "Đồng Hới", "Buôn Ma Thuột", "Hải Phòng"
        ]
        for pop_loc in popular_locations:
            if query_lower in pop_loc.lower():
                unique_locations.add(pop_loc)
                
        # Return results limited
        return {
            "users": users_result[:limit],
            "posts": posts_result[:limit],
            "locations": list(unique_locations)[:limit]
        }
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail="Lỗi tìm kiếm")
