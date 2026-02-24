-- Add DEGRADED state for heartbeat-derived source health transitions.
-- Keep ERROR for backward compatibility with legacy rows/clients.
ALTER TYPE "LiveSourceStatus" ADD VALUE IF NOT EXISTS 'DEGRADED';
