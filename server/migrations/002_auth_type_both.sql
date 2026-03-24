-- Add 'both' option to auth_type ENUM for users who link Google + password
ALTER TABLE users MODIFY COLUMN auth_type ENUM('email', 'google', 'both') DEFAULT 'email';

-- Add columns for password-reset / set-password token flow
ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN password_reset_expires DATETIME NULL;
