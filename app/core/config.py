from msflib.account.config import AccountSettings
from msflib.auth.config import AuthSettings
from msflib.core.config import CoreSettings, SettingsBase
from msflib.notifications.config import NotificationSettings
from msflib.payments.config import PaymentsSettings
from msflib.tenancy import TenancySettings
from msflib.workspaces.config import WorkspaceSettings


class AppSettings(
    NotificationSettings,
    PaymentsSettings,
    WorkspaceSettings,
    TenancySettings,
    AccountSettings,
    AuthSettings,
    CoreSettings,
    SettingsBase,
):
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8

    REDIS_HOST: str | None = None
    REDIS_PORT: str | None = None
    REDIS_PASSWORD: str | None = None

    INVALID_JWT_EXPIRE: int | None = 3600
    EMAIL_TEMPLATES_DIR: str = "./app/email-templates/build"
    PASSWORD_RESET_PATH: str = "/password-reset"

    # File storage
    STORAGE_METHOD: str | None = "file"
    STORAGE_PATH: str | None = "./uploads"

    # Server-Sent Event Stream settings.
    STREAM_RETRY_TIMEOUT: int = 15000  # millisecond
    STREAM_DELAY: int = 1  # second

    # Helpr service region and map (ADR 0022). Defaults cover Eket, Akwa Ibom.
    SERVICE_REGION_NAME: str = "Eket"
    MAP_CENTER_LAT: float = 4.6420
    MAP_CENTER_LNG: float = 7.9230
    MAP_BOUNDS_SOUTH: float = 4.5800
    MAP_BOUNDS_WEST: float = 7.8500
    MAP_BOUNDS_NORTH: float = 4.7200
    MAP_BOUNDS_EAST: float = 8.0200
    MAP_MIN_ZOOM: float = 12
    MAP_MAX_ZOOM: float = 18
    MAP_DEFAULT_ZOOM: float = 14
    MAP_ZOOM_SNAP: float = 0.5
    MAP_WHEEL_PX_PER_ZOOM_LEVEL: int = 120
    MAP_TILE_URL: str = (
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
    )
    MAP_TILE_ATTRIBUTION: str = (
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        ' &copy; <a href="https://carto.com/attributions">CARTO</a>'
    )
    NEARBY_DEFAULT_RADIUS_KM: float = 5
    NEARBY_MAX_RADIUS_KM: float = 25


settings = AppSettings()
