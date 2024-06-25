import asyncio
import os
from contextlib import asynccontextmanager

from alembic.command import upgrade
from alembic.config import Config
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from backend.config.auth import get_auth_strategy_endpoints, is_authentication_enabled
from backend.config.routers import ROUTER_DEPENDENCIES
from backend.routers.agent import router as agent_router
from backend.routers.auth import router as auth_router
from backend.routers.chat import router as chat_router
from backend.routers.conversation import router as conversation_router
from backend.routers.deployment import router as deployment_router
from backend.routers.experimental_features import router as experimental_feature_router
from backend.routers.tool import router as tool_router
from backend.routers.user import router as user_router
from backend.services.logger import LoggingMiddleware
from backend.services.metrics import MetricsMiddleware

load_dotenv()

# CORS Origins
ORIGINS = ["*"]


def create_app():
    app = FastAPI()

    routers = [
        auth_router,
        chat_router,
        user_router,
        conversation_router,
        tool_router,
        deployment_router,
        experimental_feature_router,
        agent_router,
    ]

    # Dynamically set router dependencies
    # These values must be set in config/routers.py
    dependencies_type = "default"
    if is_authentication_enabled():
        # Required to save temporary OAuth state in session
        app.add_middleware(
            SessionMiddleware, secret_key=os.environ.get("AUTH_SECRET_KEY")
        )
        dependencies_type = "auth"
    for router in routers:
        if getattr(router, "name", "") in ROUTER_DEPENDENCIES.keys():
            router_name = router.name
            dependencies = ROUTER_DEPENDENCIES[router_name][dependencies_type]
            app.include_router(router, dependencies=dependencies)
        else:
            app.include_router(router)

    # Add middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(LoggingMiddleware)
    app.add_middleware(MetricsMiddleware)

    return app


app = create_app()


@app.on_event("startup")
async def startup_event():
    """
    Retrieves all the Auth provider endpoints if authentication is enabled.
    """
    if is_authentication_enabled():
        await get_auth_strategy_endpoints()


@app.get("/health")
async def health():
    """
    Health check for backend APIs
    """
    return {"status": "OK"}


@app.post("/migrate")
async def apply_migrations():
    """
    Applies Alembic migrations - useful for serverless applications
    """
    try:
        alembic_cfg = Config("src/backend/alembic.ini")
        upgrade(alembic_cfg, "head")
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error while applying Alembic migrations: {str(e)}"
        )

    return {"status": "Done"}
