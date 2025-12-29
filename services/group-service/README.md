# Group Service

FastAPI-based service for managing expedition groups, members, invitations, and cave assignments.

## Features

- **Group Management**: Create, update, and delete expedition groups
- **Member Management**: Add members with different roles (owner, admin, member)
- **Invitations**: Invite users to join groups with expiration support
- **Cave Assignments**: Assign caves to groups for management

## Roles

| Role | Permissions |
|------|-------------|
| **Owner** | Full control, can delete group, transfer ownership |
| **Admin** | Can manage members, invitations, and cave assignments |
| **Member** | Can view group details and assigned caves |

## API Endpoints

### Groups
- `POST /groups/` - Create a new group (creator becomes owner)
- `GET /groups/` - List user's groups
- `GET /groups/{group_id}` - Get group details
- `PATCH /groups/{group_id}` - Update group (admin+)
- `DELETE /groups/{group_id}` - Delete group (owner only)

### Members
- `GET /groups/{group_id}/members` - List members
- `POST /groups/{group_id}/members` - Add member directly (admin+)
- `PATCH /groups/{group_id}/members/{email}` - Update member role (admin+)
- `DELETE /groups/{group_id}/members/{email}` - Remove member (admin+)
- `POST /groups/{group_id}/leave` - Leave group

### Invitations
- `POST /groups/{group_id}/invitations` - Create invitation (admin+)
- `GET /groups/{group_id}/invitations` - List group invitations (admin+)
- `GET /groups/invitations/me` - List my pending invitations
- `POST /groups/invitations/{id}/respond` - Accept/decline invitation
- `DELETE /groups/{group_id}/invitations/{id}` - Cancel invitation (admin+)

### Cave Assignments
- `POST /groups/{group_id}/caves` - Assign cave to group (admin+)
- `GET /groups/{group_id}/caves` - List group's caves
- `GET /groups/caves/{cave_id}/group` - Get group for a cave
- `DELETE /groups/{group_id}/caves/{cave_id}` - Unassign cave (admin+)

## Development

### Prerequisites
- Python 3.12+
- PostgreSQL 16+
- Docker (optional)

### Running with Docker

```bash
cd services/group-service
docker-compose up --build
```

The service will be available at `http://localhost:8001`.

### Running locally

```bash
cd services/group-service
pip install -r requirements.txt
export DB_URL="postgresql+asyncpg://user:password@localhost:5432/group_db"
python -m src.main --reload
```

### Database Migrations

```bash
# Create a new migration
export DB_URL_SYNC="postgresql+psycopg://user:password@localhost:5432/group_db"
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_URL` | PostgreSQL async connection URL | Required |
| `DB_URL_SYNC` | PostgreSQL sync URL (for migrations) | Required for Alembic |
| `POSTGRES_USER` | Database user | `group_user` |
| `POSTGRES_PASSWORD` | Database password | `group_password` |
| `POSTGRES_DB` | Database name | `group_db` |

