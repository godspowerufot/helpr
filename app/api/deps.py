import logging
from dataclasses import dataclass

from fastapi import Depends, HTTPException
from msflib.api.deps import get_keystore_factory, get_session_factory
from msflib.auth.deps import get_account_dependencies, get_user_dependencies
from sqlmodel import Session, select

from ..core.config import settings
from ..db.session import engine
from ..models import Account, AccountStatus, ProviderProfile, User, UserType, Workspace

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database Session
get_session = get_session_factory(engine)

# Redis Keystore (falls back to MapStore if Redis server is not found).
get_keystore = get_keystore_factory(
    redis_host=settings.REDIS_HOST,
    redis_password=settings.REDIS_PASSWORD,
    redis_port=int(settings.REDIS_PORT) if settings.REDIS_PORT else 6379,
)

account_dependencies = get_account_dependencies(
    AccountModel=Account,
    oauth_token_url=f"{settings.API_V1_STR}/login",
    secret_key=settings.SECRET_KEY,
    active_statuses=[AccountStatus.active, AccountStatus.online],
    session_dep=get_session,
    keystore_dep=get_keystore,
)

get_current_account = account_dependencies.get_current_account
get_current_account_or_none = account_dependencies.get_current_account_or_none
get_current_active_account = account_dependencies.get_current_active_account
get_current_active_superuser = account_dependencies.get_current_active_superuser
RoleCheck = account_dependencies.RoleCheck

# Workspace membership; the default resolver reads the `workspace_slug` path parameter.
user_deps = get_user_dependencies(
    UserModel=User,
    WorkspaceModel=Workspace,
    session_dep=get_session,
    account_dependencies=account_dependencies,
)


@dataclass
class ProviderContext:
    account: Account
    workspace: Workspace
    profile: ProviderProfile


def _provider_profile(
    workspace: Workspace = Depends(user_deps.get_current_workspace),
    session: Session = Depends(get_session),
) -> ProviderProfile:
    profile = session.exec(
        select(ProviderProfile).where(ProviderProfile.workspace_id == workspace.id)
    ).first()
    if profile is None:
        raise HTTPException(status_code=404, detail="Provider not found.")
    return profile


def get_provider_context(
    profile: ProviderProfile = Depends(_provider_profile),
    workspace: Workspace = Depends(user_deps.get_current_workspace),
    account: Account = Depends(get_current_active_account),
    _user: User = Depends(user_deps.get_current_active_user),
    _role: bool = Depends(user_deps.WorkspaceRoleCheck([UserType.owner, UserType.admin])),
) -> ProviderContext:
    """Provider routes (ADR 0005): the workspace must be a provider (404 otherwise, which
    covers `default`), and the caller an active owner/admin member (403 otherwise)."""
    return ProviderContext(account=account, workspace=workspace, profile=profile)
