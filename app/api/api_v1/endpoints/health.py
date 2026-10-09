from fastapi import APIRouter, Depends, Response, status
from msflib.core.store import StoreInterface
from sqlmodel import Session

from app.api import deps
from app.schemas.health import HealthRead
from app.services.health import get_health

router = APIRouter()


@router.get("", response_model=HealthRead)
def read_health(
    response: Response,
    session: Session = Depends(deps.get_session),
    keystore: StoreInterface = Depends(deps.get_keystore),
) -> HealthRead:
    """Public. Reports database, MSFLib seed data and keystore status; 503 when degraded."""
    health = get_health(session, keystore)
    if health.status != "ok":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return health
