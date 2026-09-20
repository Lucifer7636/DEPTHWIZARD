from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
from app.config import settings
from app.database import engine
from app.models.models import Base
from app.routers import projects, upload, processing, depth, calibration, height, reconstruction, flythrough, reports, demo, health
from app.services.demo_service import get_demo_data

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Ensure dirs exist
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.OUTPUT_DIR, exist_ok=True)
    
    # Pre-generate demo assets so demo mode & hero split-slider work immediately
    try:
        get_demo_data()
    except Exception as e:
        print(f"Notice: Demo data pre-generation skipped: {e}")
        
    yield
    # Cleanup on shutdown if needed

app = FastAPI(title="DepthWizard API", lifespan=lifespan)

# Allow cross-origin requests from Vercel frontend and local development
# Note: allow_credentials=False with allow_origins=["*"] complies with standard CORS specification
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

from fastapi.responses import JSONResponse
from fastapi import Request

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    tb = traceback.format_exc()
    print(f"[GLOBAL_ERROR] {request.method} {request.url.path}: {exc}\n{tb}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"{exc.__class__.__name__}: {str(exc)}"}
    )

app.mount("/data/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.mount("/data/outputs", StaticFiles(directory=settings.OUTPUT_DIR), name="outputs")

# Include routers
app.include_router(projects.router, prefix="/api/v1")
app.include_router(upload.router, prefix="/api/v1")
app.include_router(processing.router, prefix="/api/v1")
app.include_router(depth.router, prefix="/api/v1")
app.include_router(calibration.router, prefix="/api/v1")
app.include_router(height.router, prefix="/api/v1")
app.include_router(reconstruction.router, prefix="/api/v1")
app.include_router(flythrough.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(demo.router, prefix="/api/v1")
app.include_router(health.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Welcome to DepthWizard API",
        "version": "1.0.0",
        "health": "/api/v1/health",
        "docs": "/docs"
    }
