import secrets
from typing import Any

from msflib.account.eventbus.events import EventName as AccountEvent
from msflib.auth.models import GoogleUserInfo
from msflib.eventbus import emitter
from sqlmodel import Session

from app.actions import account_action
from app.models import AccountCreate


def create_google_account(user_info: GoogleUserInfo, options: dict[str, Any]) -> None:
    """Listener for MSFLib `google-account-create` (ADR 0029).

    Same account as open registration (ADR 0004). Calls `account_action.create`, not
    `create_account`: the latter emails the password, and this one is random and unused.
    """
    session: Session = options["session"]
    data = AccountCreate(email=user_info.email.lower(), password=secrets.token_urlsafe(32))
    account = account_action.create(session=session, data=data)
    emitter.emit_optional(AccountEvent.ACCOUNT_CREATED, account, {"session": session, "data": data})
