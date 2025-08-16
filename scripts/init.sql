CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE processor AS ENUM ('default', 'fallback');

CREATE UNLOGGED TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY NOT NULL,
    correlation_id UUID UNIQUE NOT NULL,
    requested_at TIMESTAMP NOT NULL,
    amount decimal(10, 2) NOT NULL,
    processor processor NOT NULL
);

CREATE INDEX idx_transactions ON transactions (requested_at, processor) INCLUDE (amount);

ALTER SYSTEM SET max_connections = '10';                    -- lower connection count to save memory
ALTER SYSTEM SET shared_buffers = '24MB';                   -- ~25% of total memory
ALTER SYSTEM SET effective_cache_size = '48MB';             -- ~50% of available RAM
ALTER SYSTEM SET work_mem = '2MB';                          -- per query operation
ALTER SYSTEM SET maintenance_work_mem = '4MB';              -- used during VACUUM, CREATE INDEX
ALTER SYSTEM SET wal_buffers = '1MB';                       -- just enough for small bursts
ALTER SYSTEM SET checkpoint_completion_target = '0.9';      -- smooth out I/O
ALTER SYSTEM SET min_wal_size = '64MB';
ALTER SYSTEM SET max_wal_size = '128MB';
ALTER SYSTEM SET default_statistics_target = '50';
ALTER SYSTEM SET random_page_cost = '1.1';                  -- assuming SSD
ALTER SYSTEM SET effective_io_concurrency = '100';          -- assuming SSD
ALTER SYSTEM SET huge_pages = 'off';
ALTER SYSTEM SET synchronous_commit = 'off';
ALTER SYSTEM SET wal_writer_delay = '50ms';
ALTER SYSTEM SET commit_delay = '0';
