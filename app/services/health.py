import logging

from msflib.core.store import MapStore, StoreInterface
from sqlmodel import Session

from app.actions import tenant_action, workspace_action
from app.core.config import settings
from app.schemas.health import HealthCheck, HealthRead

logger = logging.getLogger(__name__)

KEYSTORE_PROBE_KEY = "helpr:health"


def check_database(session: Session) -> HealthCheck:
    try:
        session.connection().exec_driver_sql("SELECT 1")
    except Exception:
        logger.exception("Health check: database unreachable")
        return HealthCheck(ok=False, detail="unreachable")
    return HealthCheck(ok=True, detail=session.get_bind().dialect.name)


def check_msflib_seed(session: Session) -> dict[str, HealthCheck]:
    # Read-only lookups: ensure_default_tenant/ensure_default_workspace would create rows.
    try:
        tenant = tenant_action.get_by_all(session, slug=settings.DEFAULT_TENANT_SLUG)
        workspace = (
            workspace_action.get_by_all(session, is_default=True, tenant_id=tenant.id)
            if tenant
            else None
        )
    except Exception:
        logger.exception("Health check: MSFLib tables unreadable")
        failed = HealthCheck(ok=False, detail="tables missing; run app.initial_data")
        return {"default_tenant": failed, "default_workspace": failed}

    return {
        "default_tenant": HealthCheck(
            ok=tenant is not None,
            detail=tenant.slug if tenant else "missing; run app.initial_data",
        ),
        "default_workspace": HealthCheck(
            ok=workspace is not None,
            detail=workspace.slug if workspace else "missing; run app.initial_data",
        ),
    }


def check_keystore(keystore: StoreInterface) -> HealthCheck:
    backend = "memory" if isinstance(keystore, MapStore) else "redis"
    try:
        keystore.put(KEYSTORE_PROBE_KEY, time=10, value="ok")
        ok = keystore.get(KEYSTORE_PROBE_KEY) == "ok"
        keystore.remove(KEYSTORE_PROBE_KEY)
    except Exception:
        logger.exception("Health check: keystore unreachable")
        return HealthCheck(ok=False, detail=f"{backend} unreachable")
    return HealthCheck(ok=ok, detail=backend)


def get_health(session: Session, keystore: StoreInterface) -> HealthRead:
    checks = {"database": check_database(session)}
    checks.update(check_msflib_seed(session))
    checks["keystore"] = check_keystore(keystore)
    status = "ok" if all(check.ok for check in checks.values()) else "degraded"
    return HealthRead(status=status, service=settings.PROJECT_NAME, checks=checks)
