-- PostgreSQL initialization script for CardFlow
-- This script runs when the container is first created

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create schema if not exists (Prisma will manage tables)
CREATE SCHEMA IF NOT EXISTS public;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE cardflow TO cardflow;
GRANT ALL PRIVILEGES ON SCHEMA public TO cardflow;
