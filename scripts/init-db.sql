-- Initialize database for Kemotown

-- Create Kemotown database if not exists
SELECT 'CREATE DATABASE kemotown'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'kemotown')\gexec

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE kemotown TO postgres;