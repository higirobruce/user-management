-- init.sql
-- This file will be executed when the PostgreSQL container starts for the first time

-- Create the database if it doesn't exist
CREATE DATABASE user_management;

-- Connect to the database
\c user_management;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'minister');
CREATE TYPE user_status AS ENUM ('active', 'inactive');

-- The users table will be created automatically by TypeORM
-- This file is mainly for initial setup and can include seed data

-- Example: Insert a default admin user (password: admin123)
-- This will be created after TypeORM creates the table
-- You should change this password in production!

INSERT INTO users (
    id,
    "firstName", 
    "lastName", 
    email, 
    password, 
    ministry, 
    role, 
    status,
    "createdAt",
    "updatedAt"
) VALUES (
    uuid_generate_v4(),
    'System',
    'Administrator',
    'admin@government.gov',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiY6Kb3WQrJG', -- admin123
    'IT Department',
    'admin',
    'active',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;