import logging
from typing import Optional, BinaryIO
import asyncio
from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient
from azure.core.exceptions import ResourceExistsError, ResourceNotFoundError
from src.config.settings import settings

logger = logging.getLogger(__name__)

class AzureBlobStorage:
    def __init__(self):
        self.blob_service_client = None
        self.container_name = settings.azure_storage_container_name
        
        # Validate and initialize blob service client
        if settings.azure_storage_connection_string:
            try:
                self.blob_service_client = BlobServiceClient.from_connection_string(
                    settings.azure_storage_connection_string
                )
                logger.info("Initialized Azure Blob Storage with connection string")
            except Exception as e:
                logger.error(f"Error creating blob service client from connection string: {e}")
                raise
        elif settings.azure_storage_account_name and settings.azure_storage_account_key:
            account_url = f"https://{settings.azure_storage_account_name}.blob.core.windows.net"
            try:
                self.blob_service_client = BlobServiceClient(
                    account_url=account_url,
                    credential=settings.azure_storage_account_key
                )
                logger.info(f"Initialized Azure Blob Storage with account key for {settings.azure_storage_account_name}")
            except Exception as e:
                logger.error(f"Error creating blob service client: {e}")
                raise
        else:
            raise ValueError("Azure storage credentials not configured")

        # Ensure container exists
        self._ensure_container_exists()

    def _ensure_container_exists(self):
        """Create the container if it doesn't exist."""
        try:
            self.blob_service_client.create_container(self.container_name)
            logger.info(f"Created container: {self.container_name}")
        except ResourceExistsError:
            logger.info(f"Container already exists: {self.container_name}")
        except Exception as e:
            logger.error(f"Error creating container: {e}")
            raise

    async def upload_file(self, file_data: BinaryIO, blob_name: str, content_type: str = None) -> str:
        """Upload a file to Azure Blob Storage.

        Args:
            file_data: File-like object to upload
            blob_name: Name of the blob in storage
            content_type: MIME type of the file

        Returns:
            The blob URL
        """
        try:
            loop = asyncio.get_event_loop()
            
            def _upload():
                blob_client = self.blob_service_client.get_blob_client(
                    container=self.container_name,
                    blob=blob_name
                )
                file_data.seek(0)
                blob_client.upload_blob(
                    file_data,
                    overwrite=True,
                    content_type=content_type
                )
                return blob_client.url
            
            url = await loop.run_in_executor(None, _upload)
            logger.info(f"Successfully uploaded file: {blob_name}")
            return url

        except Exception as e:
            logger.error(f"Error uploading file {blob_name}: {e}")
            raise

    async def download_file(self, blob_name: str) -> bytes:
        """Download a file from Azure Blob Storage.

        Args:
            blob_name: Name of the blob to download

        Returns:
            File content as bytes
        """
        try:
            loop = asyncio.get_event_loop()
            
            def _download():
                blob_client = self.blob_service_client.get_blob_client(
                    container=self.container_name,
                    blob=blob_name
                )
                download_stream = blob_client.download_blob()
                return download_stream.readall()
            
            data = await loop.run_in_executor(None, _download)
            logger.info(f"Successfully downloaded file: {blob_name}")
            return data

        except ResourceNotFoundError:
            logger.error(f"Blob not found: {blob_name}")
            raise FileNotFoundError(f"File {blob_name} not found in storage")
        except Exception as e:
            logger.error(f"Error downloading file {blob_name}: {e}")
            raise

    async def delete_file(self, blob_name: str) -> bool:
        """Delete a file from Azure Blob Storage.

        Args:
            blob_name: Name of the blob to delete

        Returns:
            True if deleted, False if not found
        """
        try:
            loop = asyncio.get_event_loop()
            
            def _delete():
                blob_client = self.blob_service_client.get_blob_client(
                    container=self.container_name,
                    blob=blob_name
                )
                blob_client.delete_blob()
                return True
            
            await loop.run_in_executor(None, _delete)
            logger.info(f"Successfully deleted file: {blob_name}")
            return True

        except ResourceNotFoundError:
            logger.warning(f"Blob not found for deletion: {blob_name}")
            return False
        except Exception as e:
            logger.error(f"Error deleting file {blob_name}: {e}")
            raise

    async def get_file_url(self, blob_name: str, expiry_hours: int = 24) -> str:
        """Get a signed URL for accessing the file.

        Args:
            blob_name: Name of the blob
            expiry_hours: How many hours the URL should be valid

        Returns:
            Signed URL for accessing the file
        """
        try:
            from datetime import datetime, timedelta
            from azure.storage.blob import BlobSasPermissions, generate_blob_sas

            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name,
                blob=blob_name
            )

            # Generate SAS token
            sas_token = generate_blob_sas(
                account_name=settings.azure_storage_account_name,
                container_name=self.container_name,
                blob_name=blob_name,
                account_key=settings.azure_storage_account_key,
                permission=BlobSasPermissions(read=True),
                expiry=datetime.utcnow() + timedelta(hours=expiry_hours)
            )

            url = f"{blob_client.url}?{sas_token}"
            return url

        except Exception as e:
            logger.error(f"Error generating signed URL for {blob_name}: {e}")
            raise

    async def file_exists(self, blob_name: str) -> bool:
        """Check if a file exists in blob storage.

        Args:
            blob_name: Name of the blob to check

        Returns:
            True if file exists, False otherwise
        """
        try:
            loop = asyncio.get_event_loop()
            
            def _exists():
                blob_client = self.blob_service_client.get_blob_client(
                    container=self.container_name,
                    blob=blob_name
                )
                return blob_client.exists()
            
            exists = await loop.run_in_executor(None, _exists)
            return exists

        except Exception as e:
            logger.error(f"Error checking if file exists {blob_name}: {e}")
            return False


# Global instance - lazy initialization
_azure_storage_instance = None

def get_azure_storage() -> AzureBlobStorage:
    """Get the global Azure storage instance, creating it if necessary."""
    global _azure_storage_instance
    if _azure_storage_instance is None:
        _azure_storage_instance = AzureBlobStorage()
    return _azure_storage_instance

# For backward compatibility, provide the instance through a property-like access
class _AzureStorageProxy:
    """Proxy class that lazily initializes Azure storage on first access."""

    def __getattr__(self, name):
        return getattr(get_azure_storage(), name)

# Global instance (now lazy)
azure_storage = _AzureStorageProxy()
