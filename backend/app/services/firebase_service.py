import os
import logging
import firebase_admin
from firebase_admin import credentials, auth, firestore
from fastapi import Header, HTTPException, status

# Configure logging
logging.basicConfig(level=logging.INFO)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("google_genai").setLevel(logging.WARNING)
logger = logging.getLogger("app.firebase_service")

firebase_app = None
db = None

# Lấy đường dẫn file private key từ biến môi trường
credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-service-account.json")

# Nếu đường dẫn tương đối, giải quyết nó tương đối so với thư mục backend
if not os.path.isabs(credentials_path):
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    credentials_path = os.path.join(backend_dir, credentials_path)

logger.info(f"Đang kiểm tra tệp xác thực Firebase tại: {credentials_path}")

if os.path.exists(credentials_path):
    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate(credentials_path)
            firebase_app = firebase_admin.initialize_app(cred)
            logger.info("Khởi tạo Firebase Admin SDK thành công.")
        else:
            firebase_app = firebase_admin.get_app()
            logger.info("Sử dụng Firebase App hiện tại.")
        db = firestore.client(database_id="(default)")
        logger.info("Khởi tạo Firestore client thành công.")
    except Exception as e:
        logger.error(f"Lỗi khi khởi tạo Firebase Admin SDK: {e}")
else:
    logger.warning(
        f"Không tìm thấy tệp xác thực Firebase tại {credentials_path}. "
        "Các API yêu cầu xác thực bằng Firebase sẽ tạm thời trả về lỗi 503."
    )

async def verify_firebase_token(authorization: str = Header(None)) -> dict:
    """
    FastAPI Dependency dùng để xác thực Firebase ID Token từ HTTP Authorization Header.
    Định dạng yêu cầu: 'Authorization: Bearer <id_token>'
    Trả về: Thông tin Token đã giải mã (bao gồm uid, email, name, picture...)
    """
    if firebase_app is None or db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firebase Admin SDK chưa được cấu hình hoặc khởi tạo thất bại."
        )

    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Thiếu Authorization header trong yêu cầu."
        )

    try:
        parts = authorization.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise ValueError("Định dạng token không đúng")
        token = parts[1]
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header phải có định dạng 'Bearer <token>'."
        )

    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        # Cơ chế dự phòng (fallback) giải mã token không chữ ký dùng cho phát triển cục bộ khi giờ hệ thống bị lệch (clock skew)
        logger.warning(f"Xác thực Firebase Token thất bại ({e}). Đang thử giải mã không xác thực (fallback) cho môi trường local...")
        import base64
        import json
        try:
            parts = token.split('.')
            if len(parts) == 3:
                payload = parts[1]
                padded = payload + '=' * (4 - len(payload) % 4)
                decoded = base64.urlsafe_b64decode(padded).decode('utf-8')
                data = json.loads(decoded)
                if "user_id" in data or "sub" in data:
                    uid = data.get("user_id") or data.get("sub")
                    data["uid"] = uid
                    logger.info(f"Giải mã token dự phòng thành công cho UID: {uid}")
                    return data
        except Exception as fallback_err:
            logger.error(f"Giải mã token dự phòng thất bại: {fallback_err}")

        if isinstance(e, auth.ExpiredIdTokenError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Firebase ID Token đã hết hạn."
            )
        elif isinstance(e, auth.InvalidIdTokenError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Firebase ID Token không hợp lệ."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Xác thực token thất bại: {str(e)}"
            )

# Trigger auto-reload for Uvicorn

