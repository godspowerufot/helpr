from fastapi.testclient import TestClient
from sqlmodel import Session

from app.actions import tenant_action
from app.core.config import settings


def test_health_ok_without_auth(client: TestClient) -> None:
    r = client.get(f"{settings.API_V1_STR}/health")
    result = r.json()
    assert r.status_code == 200
    assert result["status"] == "ok"
    assert result["service"] == settings.PROJECT_NAME
    assert set(result["checks"]) == {
        "database",
        "default_tenant",
        "default_workspace",
        "keystore",
    }
    assert result["checks"]["default_tenant"]["detail"] == settings.DEFAULT_TENANT_SLUG
    assert result["checks"]["keystore"] == {"ok": True, "detail": "memory"}


def test_health_degraded_without_default_tenant(client: TestClient, session: Session) -> None:
    tenant = tenant_action.get_by_all(session, slug=settings.DEFAULT_TENANT_SLUG)
    tenant.slug = "renamed"
    session.add(tenant)
    session.commit()

    r = client.get(f"{settings.API_V1_STR}/health")
    result = r.json()
    assert r.status_code == 503
    assert result["status"] == "degraded"
    assert result["checks"]["default_tenant"]["ok"] is False
    assert result["checks"]["default_workspace"]["ok"] is False


def test_health_does_not_create_seed_rows(client: TestClient, session: Session) -> None:
    tenant = tenant_action.get_by_all(session, slug=settings.DEFAULT_TENANT_SLUG)
    tenant.slug = "renamed"
    session.add(tenant)
    session.commit()

    client.get(f"{settings.API_V1_STR}/health")

    assert tenant_action.get_by_all(session, slug=settings.DEFAULT_TENANT_SLUG) is None
