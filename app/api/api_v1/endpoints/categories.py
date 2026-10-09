from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.api import deps
from app.schemas.category import CategoryPublic
from app.services import marketplace

router = APIRouter()


@router.get("", response_model=list[CategoryPublic])
def read_categories(session: Session = Depends(deps.get_session)) -> list[CategoryPublic]:
    """Public. Platform-wide service categories."""
    return marketplace.list_categories(session)
