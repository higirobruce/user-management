# User Management Service, by Software Solutions Division at RISA

A comprehensive user management service built with NestJS, featuring JWT authentication, role-based access control, API key management, and PostgreSQL database integration.

## Features

- **User Authentication**: JWT-based authentication with access and refresh tokens
- **User Registration**: Register users with personal details, ministry/department, and role assignment
- **Password Management**: Secure password hashing and reset functionality via email
- **User Profile Management**: Update user information and change passwords
- **Role-Based Access Control**: Admin and Minister roles with appropriate permissions
- **API Key Management**: Generate and manage API keys for programmatic access
- **User Status Management**: Activate/deactivate user accounts
- **RESTful API**: Comprehensive REST API with Swagger documentation
- **Docker Support**: Containerized application with PostgreSQL database

## Technology Stack

- **Backend**: NestJS (Node.js framework)
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **API Documentation**: Swagger/OpenAPI
- **Containerization**: Docker & Docker Compose
- **Validation**: class-validator
- **ORM**: TypeORM

## Prerequisites

- Node.js 18+ (if running locally)
- Docker and Docker Compose (recommended)
- PostgreSQL (if not using Docker)

## Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd user-management-service
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - API: http://localhost:3000
   - Swagger Documentation: http://localhost:3000/api
   - pgAdmin: http://localhost:8080 (admin@admin.com / admin)

## Local Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup PostgreSQL database**
   - Create a PostgreSQL database named `user_management`
   - Update `.env` file with your database credentials

3. **Start the application**
   ```bash
   npm run start:dev
   ```

## API Endpoints

### Authentication Endpoints

- `POST /auth/register` - Register a new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token

### User Management Endpoints

- `GET /users` - Get all users (Admin only)
- `GET /users/profile` - Get current user profile
- `GET /users/:id` - Get user by ID (Admin only)
- `PATCH /users/profile` - Update current user profile
- `PATCH /users/:id` - Update user by ID (Admin only)
- `PATCH /users/profile/change-password` - Change password
- `PATCH /users/:id/activate` - Activate user (Admin only)
- `PATCH /users/:id/deactivate` - Deactivate user (Admin only)
- `DELETE /users/:id` - Delete user (Admin only)

### API Key Management Endpoints

- `POST /api-keys` - Create a new API key (Requires JWT authentication)

### Cabinet Event Endpoints

- `POST /cabinet-event` - Create a new event
- `GET /cabinet-event` - Get all events
- `GET /cabinet-event/:id` - Get event by ID
- `PATCH /cabinet-event/:id` - Update event by ID
- `DELETE /cabinet-event/:id` - Delete event by ID

### Availability Endpoints

- `POST /availability` - Create availability
- `GET /availability/mine` - Get current user's availability
- `GET /availability/all` - Get all availabilities
- `PATCH /availability/:id` - Update availability by ID
- `DELETE /availability/:id` - Delete availability by ID
- `DELETE /availability/all` - Delete all availabilities (Admin only)

## User Roles

### Admin
- Full access to all endpoints
- Can create, read, update, and delete users
- Can activate/deactivate user accounts
- Can view all user information

### Minister
- Can view and update their own profile
- Can change their own password
- Limited access to user management features

## User Status

- **Active**: User can log in and access the system
- **Inactive**: User cannot log in (account disabled)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|\n| `DB_HOST` | Database host | localhost |\n| `DB_PORT` | Database port | 5432 |\n| `DB_USERNAME` | Database username | postgres |\n| `DB_PASSWORD` | Database password | password |\n| `DB_NAME` | Database name | user_management |\n| `JWT_SECRET` | JWT secret key | your-secret-key |\n| `JWT_REFRESH_SECRET` | JWT refresh secret key | your-refresh-secret-key |\n| `PORT` | Application port | 3000 |\n| `NODE_ENV` | Environment | development |\n
## Security Features

- **Password Hashing**: All passwords are hashed using bcryptjs with salt rounds
- **JWT Tokens**: Access tokens (15 minutes) and refresh tokens (7 days)
- **Role-Based Access**: Different access levels for Admin and Minister roles
- **Token Invalidation**: Refresh tokens are invalidated on logout and password change
- **Input Validation**: All inputs are validated using class-validator
- **SQL Injection Protection**: TypeORM provides ORM-level protection
- **API Key Authentication**: Secure endpoints with `x-api-key` header validation

## Database Schema

### Users Table
- `id` (UUID) - Primary key
- `firstName` (String) - User's first name
- `lastName` (String) - User's last name
- `email` (String) - Unique email address
- `password` (String) - Hashed password
- `ministry` (String) - Ministry/Department name
- `role` (Enum) - User role (admin, minister)
- `status` (Enum) - Account status (active, inactive)
- `refreshToken` (String) - Hashed refresh token
- `passwordResetToken` (String) - Password reset token
- `passwordResetExpires` (Date) - Password reset token expiration
- `createdAt` (Date) - Account creation timestamp
- `updatedAt` (Date) - Last update timestamp
- `apiKeys` (Relation) - One-to-many relationship with ApiKey entity

### ApiKeys Table
- `id` (UUID) - Primary key
- `key` (String) - The API key (unique)
- `name` (String) - A descriptive name for the key
- `status` (Enum) - `active`, `inactive`, `revoked`
- `permissions` (Array) - Scopes or permissions for the key
- `lastUsedAt` (Date) - Timestamp of the last time the key was used
- `expiresAt` (Date) - Expiration date for the key
- `createdAt` (Date) - Creation timestamp
- `updatedAt` (Date) - Last update timestamp
- `user` (Relation) - Many-to-one relationship with User entity

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Rebuild and start
docker-compose up -d --build

# Access database
docker-compose exec postgres psql -U postgres -d user_management
```

## API Testing Examples

### Register a new user
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@ministry.gov",
    "password": "securePassword123",
    "ministry": "Ministry of Health",
    "role": "minister"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@ministry.gov",
    "password": "securePassword123"
  }'
```

### Refresh Access Token
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Authorization: Bearer YOUR_REFRESH_TOKEN"
```

### Get user profile (with JWT token)
```bash
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update User Profile
```bash
curl -X PATCH http://localhost:3000/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Johnathan"
  }'
```

### Change Password
```bash
curl -X PATCH http://localhost:3000/users/profile/change-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "securePassword123",
    "newPassword": "newSecurePassword456"
  }'
```

### Get All Users (Admin)
```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### Get User by ID (Admin)
```bash
curl -X GET http://localhost:3000/users/USER_ID \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### Update User by ID (Admin)
```bash
curl -X PATCH http://localhost:3000/users/USER_ID \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'
```

### Activate/Deactivate User (Admin)
```bash
# Activate
curl -X PATCH http://localhost:3000/users/USER_ID/activate \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

# Deactivate
curl -X PATCH http://localhost:3000/users/USER_ID/deactivate \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### Delete User (Admin)
```bash
curl -X DELETE http://localhost:3000/users/USER_ID \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### Create API Key
```bash
curl -X POST http://localhost:3000/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Test Key",
    "permissions": ["read:data"],
    "expiresAt": "2024-12-31T23:59:59.000Z"
  }'
```

### Using an API Key
```bash
curl -X GET http://localhost:3000/some-protected-route \
  -H "x-api-key: YOUR_API_KEY"
```

### Cabinet Event API Examples

#### Create a new event
```bash
curl -X POST http://localhost:3000/cabinet-event \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Team Meeting",
    "description": "Weekly team sync-up",
    "venue": "Office Building",
    "startDate": "2024-07-20T10:00:00Z",
    "endDate": "2024-07-20T11:00:00Z"
  }'
```

#### Get all events
```bash
curl -X GET http://localhost:3000/cabinet-event \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get event by ID
```bash
curl -X GET http://localhost:3000/cabinet-event/EVENT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Update event by ID
```bash
curl -X PATCH http://localhost:3000/cabinet-event/EVENT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Team Meeting",
    "venue": "Virtual Meeting"
  }'
```

#### Delete event by ID
```bash
curl -X DELETE http://localhost:3000/cabinet-event/EVENT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Availability API Examples

#### Create availability
```bash
curl -X POST http://localhost:3000/availability \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-07-25",
    "startTime": "09:00",
    "endTime": "17:00",
    "isAvailable": true
  }'
```

#### Get current user's availability
```bash
curl -X GET http://localhost:3000/availability/mine \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get all availabilities (Admin only)
```bash
curl -X GET http://localhost:3000/availability/all \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

#### Update availability by ID
```bash
curl -X PATCH http://localhost:3000/availability/AVAILABILITY_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isAvailable": false,
    "endTime": "12:00"
  }'
```

#### Delete availability by ID
```bash
curl -X DELETE http://localhost:3000/availability/AVAILABILITY_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Delete all availabilities (Admin only)
```bash
curl -X DELETE http://localhost:3000/availability/all \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

## Production Deployment

1. **Environment Configuration**
   - Set strong JWT secrets
   - Use a secure database password
   - Set `NODE_ENV=production`
   - Configure email settings for password reset

2. **Database Security**
   - Use SSL connections
   - Limit database access
   - Regular backups

3. **Application Security**
   - Use HTTPS
   - Implement rate limiting
   - Set up monitoring and logging
   - Regular security updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the repository or contact the development team @ softwaredivision@risa.gov.rw.