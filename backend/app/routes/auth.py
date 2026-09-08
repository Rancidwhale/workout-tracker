"""
Auth routes — .

POST /auth/signup   - create account
POST /auth/login    - issue access + refresh token pair
POST /auth/refresh  - exchange a valid refresh token for a new access token
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import (
    AccessTokenResponse,
    LoginRequest,
    RefreshRequest,
    SignupRequest,
    TokenResponse,
    UserOut,
)
from app.utils.security import (
    create_access_token,
    decode_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    refresh_token_expiry,
    verify_password,
)

router = APIRouter()

# tokenUrl is just for the OpenAPI docs "Authorize" button; the actual login
# endpoint takes JSON, not form-encoded credentials.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        display_name=payload.display_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(user.id)

    plaintext_refresh_token = generate_refresh_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_refresh_token(plaintext_refresh_token),
            expires_at=refresh_token_expiry(),
        )
    )
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=plaintext_refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/refresh", response_model=AccessTokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    token_hash = hash_refresh_token(payload.refresh_token)
    stored = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == token_hash)
        .first()
    )

    if not stored or stored.revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )
    if stored.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired"
        )

    access_token = create_access_token(stored.user_id)
    return AccessTokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


# --- Shared dependency for protecting other routers (workouts, progress, etc.) ---

def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user_id = decode_access_token(token)
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user