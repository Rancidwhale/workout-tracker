"""
Shared FastAPI dependencies.

`get_current_user` protects any route that needs an authenticated user:

    @router.get("/workouts")
    def list_workouts(current_user: User = Depends(get_current_user)): ...
"""
import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.utils.security import decode_access_token

# tokenUrl is just for the OpenAPI docs "Authorize" button; the actual login
# endpoint takes JSON, not form-encoded credentials.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    subject = decode_access_token(token)
    if subject is None:
        raise credentials_exception

    try:
        user_id = uuid.UUID(subject)
    except ValueError:
        raise credentials_exception

    user = db.get(User, user_id)
    if user is None:
        raise credentials_exception
    return user
