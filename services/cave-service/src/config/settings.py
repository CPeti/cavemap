from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    db_url: Optional[str] = None

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()