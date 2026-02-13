from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

app = FastAPI(
    title="DataPilot API",
    version="0.1.0",
    description="Business Intelligence platform with conversational AI",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# TODO: Include routers in Phase 1 implementation
# from app.routers import auth, workspaces, data_sources, dashboards, ai
# app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
# app.include_router(workspaces.router, prefix="/api/v1/workspaces", tags=["workspaces"])
# app.include_router(data_sources.router, prefix="/api/v1/data-sources", tags=["data-sources"])
# app.include_router(dashboards.router, prefix="/api/v1/dashboards", tags=["dashboards"])
# app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
