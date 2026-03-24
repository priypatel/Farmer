-- Soft delete for master data tables using deleted_at only
-- UNIQUE on (name, deleted_at) allows same name after soft delete

-- Crops
ALTER TABLE crops
  ADD COLUMN deleted_at DATETIME NULL,
  DROP INDEX uk_crops_name;

CREATE UNIQUE INDEX uk_crops_name_active ON crops (name, deleted_at);

-- Locations
ALTER TABLE locations
  ADD COLUMN deleted_at DATETIME NULL,
  DROP INDEX uk_locations_name;

CREATE UNIQUE INDEX uk_locations_name_active ON locations (name, deleted_at);

-- Branches
ALTER TABLE branches
  ADD COLUMN deleted_at DATETIME NULL,
  DROP INDEX uk_branches_name;

CREATE UNIQUE INDEX uk_branches_name_active ON branches (name, deleted_at);
