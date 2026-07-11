import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration shared by all environments."""

    FLASK_ENV: str = os.getenv("FLASK_ENV", "development")
    DEBUG: bool = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    PORT: int = int(os.getenv("PORT", 5001))

    # Google Gemini API (to be used when AI logic is implemented)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Redis — shares the same Redis instance as Backend-1 (BullMQ queue)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")

    # BullMQ queue name — must match the name defined in Backend-1's resumeQueue.js
    RESUME_QUEUE_NAME: str = "resume-processing"

    # Backend-1 communication
    BACKEND1_URL: str = os.getenv("BACKEND1_URL", "http://localhost:5000")
    BACKEND1_RESULT_ENDPOINT: str = "/api/v1/shortlisted/result"

    # Shared secret for Backend-1 internal API
    INTERNAL_API_KEY: str = os.getenv("INTERNAL_API_KEY", "")


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


_config_map = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}


def get_config() -> type[Config]:
    """Return the appropriate config class based on FLASK_ENV."""
    env = os.getenv("FLASK_ENV", "development")
    return _config_map.get(env, DevelopmentConfig)
