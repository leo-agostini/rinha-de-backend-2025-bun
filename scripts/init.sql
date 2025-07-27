CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE processor AS ENUM ('default', 'fallback');

CREATE UNLOGGED TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY NOT NULL,
    correlation_id UUID UNIQUE NOT NULL,
    requested_at TIMESTAMP NOT NULL,
    amount decimal(10, 2) NOT NULL,
    processor processor
);

CREATE INDEX idx_transactions ON transactions (requested_at, processor);

-- WARNING
-- this tool not being optimal
-- for low memory systems

-- DB Version: 17
-- OS Type: linux
-- DB Type: oltp
-- Total Memory (RAM): 150 MB
-- Connections num: 80
-- Data Storage: ssd

ALTER SYSTEM SET
 max_connections = '550';
ALTER SYSTEM SET
 shared_buffers = '38400kB';
ALTER SYSTEM SET
 effective_cache_size = '115200kB';
ALTER SYSTEM SET
 maintenance_work_mem = '9600kB';
ALTER SYSTEM SET
 checkpoint_completion_target = '0.9';
ALTER SYSTEM SET
 wal_buffers = '1152kB';
ALTER SYSTEM SET
 default_statistics_target = '100';
ALTER SYSTEM SET
 random_page_cost = '1.1';
ALTER SYSTEM SET
 effective_io_concurrency = '200';
ALTER SYSTEM SET
 work_mem = '436kB';
ALTER SYSTEM SET
 huge_pages = 'off';
ALTER SYSTEM SET
 min_wal_size = '2GB';
ALTER SYSTEM SET
 max_wal_size = '8GB';