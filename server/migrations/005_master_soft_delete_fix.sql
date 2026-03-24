-- Fix: remove is_deleted, use deleted_at only
-- UNIQUE on (name, deleted_at) allows same name after soft delete

-- Fix inconsistent data: if is_deleted=0 then deleted_at should be NULL
UPDATE crops SET deleted_at = NULL WHERE is_deleted = 0 AND deleted_at IS NOT NULL;
UPDATE locations SET deleted_at = NULL WHERE is_deleted = 0 AND deleted_at IS NOT NULL;
UPDATE branches SET deleted_at = NULL WHERE is_deleted = 0 AND deleted_at IS NOT NULL;

-- Crops: drop is_deleted, drop old unique, create new unique
ALTER TABLE crops DROP COLUMN is_deleted;
ALTER TABLE crops DROP INDEX uk_crops_name;
CREATE UNIQUE INDEX uk_crops_name_active ON crops (name, deleted_at);

-- Locations: drop is_deleted, drop old unique, create new unique
ALTER TABLE locations DROP COLUMN is_deleted;
ALTER TABLE locations DROP INDEX uk_locations_name;
CREATE UNIQUE INDEX uk_locations_name_active ON locations (name, deleted_at);

-- Branches: drop is_deleted, drop old unique, create new unique
ALTER TABLE branches DROP COLUMN is_deleted;
ALTER TABLE branches DROP INDEX uk_branches_name;
CREATE UNIQUE INDEX uk_branches_name_active ON branches (name, deleted_at);
