from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.routes.api import router as api_router
import os
import sys
import io
import traceback
import builtins
import logging

# Tắt cache file pyc
os.environ["PYTHONDONTWRITEBYTECODE"] = "1"
os.environ["PYTHONIOENCODING"] = "utf-8"
os.environ["PYTHONUTF8"] = "1"

# Tạo một class Stream an toàn để bọc stdout/stderr
class SafeStream:
    def __init__(self, stream):
        self.stream = stream
    def write(self, data):
        try:
            return self.stream.write(data)
        except UnicodeEncodeError:
            return self.stream.write(data.encode('ascii', 'replace').decode('ascii'))
    def flush(self):
        if hasattr(self.stream, 'flush'):
            self.stream.flush()
    def __getattr__(self, attr):
        return getattr(self.stream, attr)

# Ghi đè sys.stdout và sys.stderr
sys.stdout = SafeStream(sys.stdout)
sys.stderr = SafeStream(sys.stderr)

# Cập nhật tất cả các logger (bao gồm cả Uvicorn) để dùng stream mới an toàn
for handler in logging.root.handlers:
    if isinstance(handler, logging.StreamHandler):
        handler.stream = sys.stdout if handler.stream.name == '<stdout>' else sys.stderr

for logger_name in logging.Logger.manager.loggerDict:
    logger = logging.getLogger(logger_name)
    if hasattr(logger, 'handlers'):
        for handler in logger.handlers:
            if isinstance(handler, logging.StreamHandler):
                if getattr(handler.stream, 'name', '') == '<stdout>':
                    handler.stream = sys.stdout
                elif getattr(handler.stream, 'name', '') == '<stderr>':
                    handler.stream = sys.stderr

# Ghi đè hàm print để đảm bảo an toàn tuyệt đối
_original_print = builtins.print
def _safe_print(*args, **kwargs):
    try:
        _original_print(*args, **kwargs)
    except UnicodeEncodeError:
        safe_args = [str(a).encode('ascii', 'replace').decode('ascii') for a in args]
        _original_print(*safe_args, **kwargs)

builtins.print = _safe_print

app = FastAPI(title="TopGo API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

# Mount dataset
dataset_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../dataset"))
app.mount("/dataset", StaticFiles(directory=dataset_dir), name="dataset")

# Đảm bảo thư mục logs tồn tại ở frontend
frontend_logs_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/logs"))
os.makedirs(frontend_logs_dir, exist_ok=True)

# Serve frontend tĩnh — PHẢI đặt CUỐI CÙNG sau tất cả các route API
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend"))
app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
