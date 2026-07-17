import os
import logging
import firebase_admin
from firebase_admin import credentials, auth, firestore
from fastapi import Header, HTTPException, status
import base64
import json

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
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if not os.path.isabs(credentials_path):
    credentials_path = os.path.join(backend_dir, credentials_path)

# =========================================================================
# LỚP GIẢ LẬP FIRESTORE CHO CHẾ ĐỘ OFFLINE LOCAL (MOCK DATABASE)
# =========================================================================

class MockDocumentSnapshot:
    def __init__(self, doc_id, data):
        self.id = doc_id
        self._data = data
        self.exists = data is not None

    def to_dict(self):
        return self._data if self._data else {}

class MockDocumentReference:
    def __init__(self, col_path, doc_id, db_instance):
        self.col_path = col_path
        self.id = doc_id
        self.db = db_instance
        self.path = f"{col_path}/{doc_id}"

    def collection(self, sub_col_name):
        return MockCollectionReference(f"{self.path}/{sub_col_name}", self.db)

    def get(self):
        data = self.db._read_path(self.path)
        return MockDocumentSnapshot(self.id, data)

    def set(self, data, merge=False):
        self.db._write_path(self.path, data, merge=merge)

    def delete(self):
        self.db._delete_path(self.path)

class MockCollectionReference:
    def __init__(self, path, db_instance):
        self.path = path
        self.db = db_instance

    def document(self, doc_id):
        return MockDocumentReference(self.path, doc_id, self.db)

    def stream(self):
        docs_data = self.db._get_collection_docs(self.path)
        return [MockDocumentSnapshot(doc_id, data) for doc_id, data in docs_data.items()]

class MockFirestore:
    def __init__(self, filepath):
        self.filepath = filepath
        self._cache = None  # In-memory cache — loaded once, stays in RAM
        self._init_db()

    def _init_db(self):
        if not os.path.exists(self.filepath):
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump({}, f)
        # Eagerly warm cache on startup
        self._cache = None
        self._load_data()

    def _load_data(self):
        # Return from in-memory cache if available (avoid repeated disk reads)
        if self._cache is not None:
            return self._cache
        try:
            if os.path.exists(self.filepath):
                with open(self.filepath, "r", encoding="utf-8") as f:
                    self._cache = json.load(f)
                    return self._cache
        except Exception as e:
            logger.error(f"Lỗi khi đọc file local_db.json: {e}")
        self._cache = {}
        return self._cache

    def _save_data(self, data):
        # Update in-memory cache first so subsequent reads see the new data immediately
        self._cache = data
        try:
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Lỗi khi ghi file local_db.json: {e}")

    def collection(self, col_name):
        return MockCollectionReference(col_name, self)

    def _read_path(self, path):
        data = self._load_data()
        return data.get(path, None)

    def _write_path(self, path, new_data, merge=False):
        data = self._load_data()
        if merge and path in data and isinstance(data[path], dict) and isinstance(new_data, dict):
            data[path] = {**data[path], **new_data}
        else:
            data[path] = new_data
        self._save_data(data)

    def _delete_path(self, path):
        data = self._load_data()
        if path in data:
            del data[path]
        
        # Clean subcollections
        keys_to_delete = [k for k in data.keys() if k.startswith(path + "/")]
        for k in keys_to_delete:
            del data[k]
            
        self._save_data(data)

    def _get_collection_docs(self, col_path):
        data = self._load_data()
        docs = {}
        for path, doc_data in data.items():
            if path.startswith(col_path + "/"):
                subpath = path[len(col_path) + 1:]
                if "/" not in subpath:
                    docs[subpath] = doc_data
        return docs

# =========================================================================
# KHỞI TẠO FIREBASE HOẶC MOCK FIRESTORE
# =========================================================================

logger.info(f"Đang kiểm tra tệp xác thực Firebase tại: {credentials_path}")

is_offline_mode = True

if os.path.exists(credentials_path):
    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate(credentials_path)
            firebase_app = firebase_admin.initialize_app(cred)
            logger.info("Khởi tạo Firebase Admin SDK thành công.")
        else:
            firebase_app = firebase_admin.get_app()
            logger.info("Sử dụng Firebase App hiện tại.")
        db = firestore.client()
        is_offline_mode = False
        logger.info("Khởi tạo Firestore client thành công.")
    except Exception as e:
        logger.error(f"Lỗi khi khởi tạo Firebase Admin SDK: {e}. Đang chuyển sang Local Mock DB...")

if is_offline_mode:
    local_db_path = os.path.join(backend_dir, "local_db.json")
    db = MockFirestore(local_db_path)
    logger.error(
        "!!! LỖI NGHIÊM TRỌNG: KHÔNG TÌM THẤY TỆP FIREBASE-SERVICE-ACCOUNT.JSON !!!\n"
        "Hệ thống KHÔNG THỂ kết nối đến máy chủ Firebase thật.\n"
        f"Để tránh sập ứng dụng, hệ thống tạm thời lưu dữ liệu vào: {local_db_path}\n"
        "Nếu bạn muốn up bài lên server thật, BẮT BUỘC phải cung cấp tệp cấu hình JSON."
    )

# =========================================================================
# TIỆN ÍCH GIẢI MÃ JWT KHÔNG CẦN CHỮ KÝ (UNVERIFIED DECODE)
# =========================================================================

def decode_jwt_unverified(token: str) -> dict:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Định dạng JWT không hợp lệ")
        payload_b64 = parts[1]
        
        # Thêm padding "=" nếu cần
        missing_padding = len(payload_b64) % 4
        if missing_padding:
            payload_b64 += "=" * (4 - missing_padding)
            
        payload_bytes = base64.urlsafe_b64decode(payload_b64)
        payload_str = payload_bytes.decode("utf-8")
        return json.loads(payload_str)
    except Exception as e:
        logger.warning(f"Lỗi giải mã unverified JWT: {e}")
        return None

# =========================================================================
# FASTAPI DEPENDENCY XÁC THỰC TOKEN
# =========================================================================

async def verify_firebase_token(authorization: str = Header(None)) -> dict:
    """
    FastAPI Dependency dùng để xác thực Firebase ID Token từ HTTP Authorization Header.
    Nếu đang chạy chế độ Local Offline (hoặc thiếu key), tự động giải mã offline hoặc
    sử dụng tài khoản thử nghiệm thay vì trả về lỗi 503 Service Unavailable.
    """
    if is_offline_mode:
        if not authorization:
            logger.info("[Offline] Không có token. Trả về tài khoản thử nghiệm cục bộ.")
            return {
                "uid": "local_offline_user",
                "email": "local_dev@topgo.vn",
                "name": "Local Traveler"
            }
            
        try:
            parts = authorization.split()
            if len(parts) != 2 or parts[0].lower() != "bearer":
                raise ValueError("Định dạng token không đúng")
            token = parts[1]
            
            # Giải mã không xác thực chữ ký (unverified decode) để lấy thông tin thực tế từ Firebase Web SDK client
            decoded = decode_jwt_unverified(token)
            if decoded:
                uid = decoded.get("sub") or decoded.get("user_id") or decoded.get("uid")
                if uid:
                    logger.info(f"[Offline] Giải mã thành công token của user {uid}.")
                    return {
                        "uid": uid,
                        "email": decoded.get("email", "local_dev@topgo.vn"),
                        "name": decoded.get("name", "Local Traveler")
                    }
        except Exception as e:
            logger.warning(f"[Offline] Lỗi giải mã token offline: {e}. Trả về tài khoản thử nghiệm cục bộ.")
            
        return {
            "uid": "local_offline_user",
            "email": "local_dev@topgo.vn",
            "name": "Local Traveler"
        }

    # Chế độ trực tuyến (Online với Firebase thật)
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
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase ID Token đã hết hạn."
        )
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase ID Token không hợp lệ."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Xác thực token thất bại: {str(e)}"
        )

async def verify_firebase_token_optional(authorization: str = Header(None)) -> dict:
    """
    FastAPI Dependency dùng để xác thực token tùy chọn.
    Nếu không có token hoặc token sai, trả về một dict trống (uid = None)
    thay vì văng lỗi 401, cho phép các API public vẫn hoạt động.
    """
    if is_offline_mode:
        if not authorization:
            return {}
        try:
            parts = authorization.split()
            if len(parts) == 2 and parts[0].lower() == "bearer":
                token = parts[1]
                decoded = decode_jwt_unverified(token)
                if decoded:
                    uid = decoded.get("sub") or decoded.get("user_id") or decoded.get("uid")
                    if uid:
                        return {
                            "uid": uid,
                            "email": decoded.get("email", ""),
                            "name": decoded.get("name", "")
                        }
        except Exception:
            pass
        return {}

    if not authorization:
        return {}

    try:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
            decoded_token = auth.verify_id_token(token)
            return decoded_token
    except Exception:
        return {}
    return {}
# Trigger auto-reload for Uvicorn

