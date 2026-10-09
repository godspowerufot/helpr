from typing import Literal

from pydantic import BaseModel


class HealthCheck(BaseModel):
    ok: bool
    detail: str


class HealthRead(BaseModel):
    status: Literal["ok", "degraded"]
    service: str
    checks: dict[str, HealthCheck]
