from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    db_url: Optional[str] = None
    rabbitmq_url: Optional[str] = None

    # Azure Blob Storage settings
    azure_storage_account_name: Optional[str] = None
    azure_storage_account_key: Optional[str] = None
    azure_storage_connection_string: Optional[str] = None
    azure_storage_container_name: str = "media-files"

    # Service settings
    service_token: Optional[str] = None

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
