from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from app.controllers.generate_controller import generate_itinerary_stream

router = APIRouter()

@router.post("/generate")
async def generate(request: Request):
    payload = await request.json()
    return StreamingResponse(
        generate_itinerary_stream(payload),
        media_type="application/x-ndjson"
    )
