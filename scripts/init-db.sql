-- Initialize databases for Kemotown and Misskey

-- Create Kemotown database if not exists
SELECT 'CREATE DATABASE kemotown'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'kemotown')\gexec

-- Create Misskey database if not exists  
SELECT 'CREATE DATABASE misskey_kemotown'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'misskey_kemotown')\gexec

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE kemotown TO postgres;
GRANT ALL PRIVILEGES ON DATABASE misskey_kemotown TO postgres;