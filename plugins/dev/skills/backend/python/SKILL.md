# Python Backend Patterns

**Skill**: python
**Plugin**: dev
**Version**: 1.0.0

## Overview

Python patterns for building backend services with FastAPI.

## Project Structure

```
project/
├── app/
│   ├── __init__.py
│   ├── main.py               # FastAPI app
│   ├── config.py             # Configuration
│   ├── dependencies.py       # Dependency injection
│   ├── routers/              # API routes
│   │   ├── __init__.py
│   │   └── users.py
│   ├── services/             # Business logic
│   ├── repositories/         # Data access
│   ├── models/               # SQLAlchemy models
│   ├── schemas/              # Pydantic schemas
│   └── utils/                # Utilities
├── tests/                    # Test files
├── migrations/               # Alembic migrations
├── pyproject.toml
└── requirements.txt
```

## FastAPI Application

### Main Application

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.routers import users, auth
from app.database import engine, Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    await engine.dispose()

app = FastAPI(
    title="My API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])

@app.get("/health")
async def health():
    return {"status": "ok"}
```

### Configuration

```python
# app/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://localhost/app"
    redis_url: str = "redis://localhost:6379"
    secret_key: str = "your-secret-key"
    access_token_expire_minutes: int = 30
    cors_origins: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
```

## Pydantic Schemas

```python
# app/schemas/user.py
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None

class UserResponse(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class PaginatedResponse(BaseModel):
    items: list[UserResponse]
    total: int
    page: int
    page_size: int
```

## SQLAlchemy Models

```python
# app/models/user.py
from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.sql import func
from app.database import Base
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

## Async Database

```python
# app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

engine = create_async_engine(settings.database_url, echo=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def get_db():
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

## Repository Pattern

```python
# app/repositories/user.py
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def find_by_id(self, id: str) -> User | None:
        result = await self.session.execute(
            select(User).where(User.id == id)
        )
        return result.scalar_one_or_none()

    async def find_by_email(self, email: str) -> User | None:
        result = await self.session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def find_all(self, page: int = 1, page_size: int = 20) -> tuple[list[User], int]:
        offset = (page - 1) * page_size

        # Get items
        result = await self.session.execute(
            select(User)
            .order_by(User.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        items = result.scalars().all()

        # Get total count
        count_result = await self.session.execute(
            select(func.count()).select_from(User)
        )
        total = count_result.scalar()

        return list(items), total

    async def create(self, data: UserCreate, password_hash: str) -> User:
        user = User(
            name=data.name,
            email=data.email,
            password_hash=password_hash,
        )
        self.session.add(user)
        await self.session.flush()
        return user

    async def update(self, user: User, data: UserUpdate) -> User:
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(user, key, value)
        await self.session.flush()
        return user

    async def delete(self, user: User) -> None:
        await self.session.delete(user)
```

## API Routes

```python
# app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.repositories.user import UserRepository
from app.services.user import UserService
from app.schemas.user import UserCreate, UserUpdate, UserResponse, PaginatedResponse
from app.dependencies import get_current_user

router = APIRouter()

def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    return UserService(UserRepository(db))

@router.get("", response_model=PaginatedResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    service: UserService = Depends(get_user_service),
):
    users, total = await service.find_all(page, page_size)
    return PaginatedResponse(
        items=users,
        total=total,
        page=page,
        page_size=page_size,
    )

@router.get("/{id}", response_model=UserResponse)
async def get_user(
    id: str,
    service: UserService = Depends(get_user_service),
):
    user = await service.find_by_id(id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreate,
    service: UserService = Depends(get_user_service),
):
    return await service.create(data)

@router.patch("/{id}", response_model=UserResponse)
async def update_user(
    id: str,
    data: UserUpdate,
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user),
):
    user = await service.update(id, data)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    id: str,
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user),
):
    success = await service.delete(id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
```

## Authentication

```python
# app/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.config import settings
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    repo = UserRepository(db)
    user = await repo.find_by_id(user_id)
    if user is None:
        raise credentials_exception
    return user
```

## Testing

```python
# tests/test_users.py
import pytest
from httpx import AsyncClient
from app.main import app
from app.database import get_db, async_session

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture
async def db():
    async with async_session() as session:
        yield session
        await session.rollback()

@pytest.mark.asyncio
async def test_list_users(client: AsyncClient):
    response = await client.get("/api/users")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data

@pytest.mark.asyncio
async def test_create_user(client: AsyncClient):
    response = await client.post("/api/users", json={
        "name": "John Doe",
        "email": "john@example.com",
        "password": "password123",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "John Doe"
    assert data["email"] == "john@example.com"

@pytest.mark.asyncio
async def test_create_user_validation(client: AsyncClient):
    response = await client.post("/api/users", json={
        "name": "J",  # Too short
        "email": "invalid",  # Invalid email
    })
    assert response.status_code == 422
```

---

*Python FastAPI patterns for backend development*
