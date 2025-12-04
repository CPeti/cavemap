# User Service

A microservice for managing user profiles and authentication data using Express.js and MongoDB.

## Features

- User profile management
- JWT-based authentication
- User registration and login endpoints
- Admin user management
- Profile updates
- Public user profiles

## API Endpoints

### Public Endpoints
- `GET /users/:id` - Get public user profile by ID

### Protected Endpoints (require authentication)
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update current user profile
- `DELETE /users/me` - Delete current user profile
- `POST /users/me/refresh` - Refresh profile data from Google OAuth

### Admin Endpoints (require admin role)
- `GET /users` - Get all users with pagination
- `PUT /users/:id/status` - Update user active status

## Google OAuth Integration

The service automatically loads user profile information from Google when users log in:

- **Email**: Primary identifier from JWT token
- **Name**: First name and last name extracted from JWT claims (`given_name`, `family_name`)
- **Avatar**: Profile picture URL from JWT claims (`picture`)
- **Username**: Preferred username from JWT claims or display name

### JWT Token Processing

1. User authenticates via Google OAuth2/OIDC
2. OAuth2 proxy validates authentication and generates JWT token with user claims
3. User service decodes the JWT token from the `Authorization: Bearer <token>` header
4. Extracts profile information from standard OIDC claims:
   - `email`: User's email address
   - `given_name`: User's first name
   - `family_name`: User's last name
   - `name`: Full display name
   - `preferred_username`: Preferred username
   - `picture`: Profile picture URL
5. Creates user record with extracted profile data

### Profile Data Flow

1. User authenticates via Google OAuth
2. OAuth2 proxy generates JWT token with Google profile claims
3. User service decodes JWT and extracts profile information
4. User record created with Google profile data populated
5. Users can update their profile information through the UI

### OAuth Scopes

The OAuth2 proxy requests the following Google scopes:
- `openid` - OpenID Connect
- `email` - Access to email address
- `profile` - Access to profile information (name, picture, etc.)

## Environment Variables

Create a `.env` file with the following variables:

```env
PORT=3002
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/cavemap_users
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start MongoDB (using docker-compose):
```bash
docker-compose up mongodb -d
```

3. Start the service:
```bash
npm run dev
```

## Docker

Build and run with Docker Compose:
```bash
docker-compose up
```

## Health Check

The service includes a health check endpoint at `/health`.

## Database Schema

The User model includes:
- username (unique)
- email (unique)
- password (hashed)
- firstName, lastName
- avatar, bio
- role (user/admin)
- isActive status
- timestamps
