from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    db_url: str

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()