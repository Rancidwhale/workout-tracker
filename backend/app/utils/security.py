"""
Security utilities —  password hashing, JWT access tokens,
and opaque refresh tokens (stored hashed, never plaintext).
"""
import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
 
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Password hashing -------------------------------------------------------
 
def hash_password(password: str) -> str:
    return pwd_context.hash(password)
 
 
def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)
 
 
# --- JWT access tokens --------------------------------------------------------
 
def create_access_token(user_id: uuid.UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
 
 
def decode_access_token(token: str) -> Optional[str]:
    """Returns the user_id (as string) from a valid token, or None if invalid/expired."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None
 
 
# --- Opaque refresh tokens ----------------------------------------------------
# Stored as a SHA-256 hash in the DB (LLD 2.2) so a DB leak doesn't leak usable
# tokens. The plaintext token is only ever returned to the client once, at
# issuance.
 
def generate_refresh_token() -> str:
    return secrets.token_urlsafe(48)
 
 
def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
 
 
def refresh_token_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
