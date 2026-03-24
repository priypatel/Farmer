-- Add refresh token storage (hashed) and indexes for token-based flows
ALTER TABLE users ADD COLUMN refresh_token TEXT NULL;
