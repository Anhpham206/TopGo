from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes.api import router as api_router
import os

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
