# User Management Service

A comprehensive user management service built with NestJS, featuring JWT authentication, role-based access control, and PostgreSQL database integration.

## Features

- **User Authentication**: JWT-based authentication with access and refresh tokens
- **User Registration**: Register users with personal details, ministry/department, and role assignment
- **Password Management**: Secure password hashing and reset functionality via email
- **User Profile Management**: Update user information and change passwords
- **Role-Based Access Control**: Admin and Minister roles with appropriate permissions
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
|----------|-------------|---------|
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `DB_USERNAME` | Database username | postgres |
| `DB_PASSWORD` | Database password | password |
| `DB_NAME` | Database name | user_management |
| `JWT_SECRET` | JWT secret key | your-secret-key |
| `JWT_REFRESH_SECRET` | JWT refresh secret key | your-refresh-secret-key |
| `PORT` | Application port | 3000 |
| `NODE_ENV` | Environment | development |

## Security Features

- **Password Hashing**: All passwords are hashed using bcryptjs with salt rounds
- **JWT Tokens**: Access tokens (15 minutes) and refresh tokens (7 days)
- **Role-Based Access**: Different access levels for Admin and Minister roles
- **Token Invalidation**: Refresh tokens are invalidated on logout and password change
- **Input Validation**: All inputs are validated using class-validator
- **SQL Injection Protection**: TypeORM provides ORM-level protection

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

### Get user profile (with JWT token)
```bash
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
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

For support and questions, please open an issue in the repository or contact the development team.