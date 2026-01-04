# Media Service

A FastAPI service for managing media files stored in Azure Blob Storage with metadata support.

## Features

- File upload to Azure Blob Storage
- File download with signed URLs
- Metadata storage and retrieval
- PostgreSQL database for metadata
- RESTful API endpoints

## API Endpoints

### Upload File
```
POST /media/upload?uploaded_by=user@example.com
Content-Type: multipart/form-data

file: <file_data>
```

### Get File Details
```
GET /media/{file_id}
```

### Download File
```
GET /media/{file_id}/download
```

### Delete File
```
DELETE /media/{file_id}
```

## Configuration

The service requires the following environment variables:

- `DB_URL`: PostgreSQL connection string
- `AZURE_STORAGE_ACCOUNT_NAME`: Azure storage account name
- `AZURE_STORAGE_ACCOUNT_KEY`: Azure storage account key
- `AZURE_STORAGE_CONTAINER_NAME`: Azure blob container name (default: "media-files")
- `SERVICE_TOKEN`: Service authentication token

## Development

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run database migrations:
   ```bash
   alembic upgrade head
   ```

3. Start the service:
   ```bash
   python -m src.main
   ```

## Docker

Build and run with Docker:

```bash
docker build -t media-service .
docker run -p 8000:8000 media-service
```
