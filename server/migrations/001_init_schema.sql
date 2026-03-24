-- =============================================
-- 001_init_schema.sql
-- Creates all tables, indexes, and seed data
-- =============================================

-- Users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NULL,
  role ENUM('admin', 'farmer', 'super_admin') NOT NULL,
  auth_type ENUM('email', 'google') DEFAULT 'email',
  google_id VARCHAR(255) NULL,
  is_deleted TINYINT(1) DEFAULT 0,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_users_email (email),
  UNIQUE KEY uk_users_google_id (google_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Crops
CREATE TABLE IF NOT EXISTS crops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  UNIQUE KEY uk_crops_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Locations
CREATE TABLE IF NOT EXISTS locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  UNIQUE KEY uk_locations_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Branches
CREATE TABLE IF NOT EXISTS branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  UNIQUE KEY uk_branches_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Farmers
CREATE TABLE IF NOT EXISTS farmers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  location_id INT NULL,
  branch_id INT NULL,
  status ENUM('active', 'pending', 'suspended') DEFAULT 'pending',
  is_deleted TINYINT(1) DEFAULT 0,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_farmers_user_id (user_id),
  CONSTRAINT fk_farmers_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_farmers_location FOREIGN KEY (location_id) REFERENCES locations(id),
  CONSTRAINT fk_farmers_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Farmer Crops (many-to-many)
CREATE TABLE IF NOT EXISTS farmer_crops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  crop_id INT NOT NULL,
  UNIQUE KEY uk_farmer_crops (farmer_id, crop_id),
  CONSTRAINT fk_farmer_crops_farmer FOREIGN KEY (farmer_id) REFERENCES farmers(id),
  CONSTRAINT fk_farmer_crops_crop FOREIGN KEY (crop_id) REFERENCES crops(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Demand
CREATE TABLE IF NOT EXISTS demand (
  id INT AUTO_INCREMENT PRIMARY KEY,
  crop_id INT NOT NULL,
  location_id INT NOT NULL,
  total_quantity DECIMAL(12, 2) NOT NULL,
  remaining_quantity DECIMAL(12, 2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  created_by INT NOT NULL,
  is_deleted TINYINT(1) DEFAULT 0,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_demand_crop FOREIGN KEY (crop_id) REFERENCES crops(id),
  CONSTRAINT fk_demand_location FOREIGN KEY (location_id) REFERENCES locations(id),
  CONSTRAINT fk_demand_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT chk_demand_remaining CHECK (remaining_quantity >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Demand Bookings
CREATE TABLE IF NOT EXISTS demand_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  demand_id INT NOT NULL,
  farmer_id INT NOT NULL,
  quantity DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_demand FOREIGN KEY (demand_id) REFERENCES demand(id),
  CONSTRAINT fk_bookings_farmer FOREIGN KEY (farmer_id) REFERENCES farmers(id),
  CONSTRAINT chk_booking_quantity CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  crop_id INT NOT NULL,
  location_id INT NOT NULL,
  quantity DECIMAL(12, 2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_inventory_crop FOREIGN KEY (crop_id) REFERENCES crops(id),
  CONSTRAINT fk_inventory_location FOREIGN KEY (location_id) REFERENCES locations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inventory Logs
CREATE TABLE IF NOT EXISTS inventory_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inventory_id INT NOT NULL,
  change_amount DECIMAL(12, 2) NOT NULL,
  reason VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_inventory_logs_inventory FOREIGN KEY (inventory_id) REFERENCES inventory(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('DEMAND_CREATED', 'DEMAND_UPDATED', 'BOOKING_DONE', 'WEATHER_ALERT') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSON,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Device Tokens (FCM)
CREATE TABLE IF NOT EXISTS device_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token TEXT NOT NULL,
  device_type ENUM('android', 'ios', 'web') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_device_tokens_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Weather Logs
CREATE TABLE IF NOT EXISTS weather_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- INDEXES (from DB_DESIGN.md indexing strategy)
-- =============================================

-- farmers indexes
CREATE INDEX idx_farmers_location ON farmers(location_id);
CREATE INDEX idx_farmers_branch ON farmers(branch_id);
CREATE INDEX idx_farmers_status ON farmers(status);

-- demand indexes
CREATE INDEX idx_demand_crop ON demand(crop_id);
CREATE INDEX idx_demand_location ON demand(location_id);
CREATE INDEX idx_demand_created_at ON demand(created_at);

-- demand_bookings indexes
CREATE INDEX idx_bookings_demand ON demand_bookings(demand_id);
CREATE INDEX idx_bookings_farmer ON demand_bookings(farmer_id);

-- notifications indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- device_tokens indexes
CREATE INDEX idx_device_tokens_user ON device_tokens(user_id);

-- =============================================
-- SEED DATA
-- =============================================

-- Default super_admin user
-- Email: admin@fpo.com | Password: Admin@123
-- bcrypt hash of 'Admin@123' (10 rounds)
INSERT INTO users (first_name, email, password, role, auth_type)
VALUES (
  'Super Admin',
  'admin@fpo.com',
  '$2b$10$J0cOZk5.Qh1SN0lGFOvAvOQ.2iEWRnto9pnRg4QugMsCSlIO67kUa',
  'super_admin',
  'email'
);
