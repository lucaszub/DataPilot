"""FastAPI dependencies — database session, current user."""

from typing import Generator

from sqlalchemy.orm import Session

from app.database import SessionLocal


def get_db() -> Generator[Session, None, None]:
    """Yield a database session, auto-close on exit."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# TODO: Implement get_current_user dependency
# - Extract JWT from Authorization header
# - Decode and validate token
# - Return User object with tenant_id
# def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
