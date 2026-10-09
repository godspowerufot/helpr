from msflib.auth.eventbus.events import EventName as AuthEvent
from msflib.eventbus import AppEmitter

from app.services.booking import PAYMENT_EVENT_KEY, on_payment_verified
from app.services.google_auth import create_google_account


def register_helpr_listeners(emitter: AppEmitter) -> None:
    """msflib-payments emits `payment-queue-execute-{event_key}` after a verify (ADR 0019)."""
    emitter.on(f"payment-queue-execute-{PAYMENT_EVENT_KEY}", on_payment_verified)
    emitter.on(AuthEvent.GOOGLE_ACCOUNT_CREATE, create_google_account)
