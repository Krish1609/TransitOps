CREATE DATABASE IF NOT EXISTS transitops;
USE transitops;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Fleet Manager','Dispatcher','Safety Officer','Financial Analyst') NOT NULL,
  failed_attempts INT DEFAULT 0,
  locked_until DATETIME NULL,
  reset_token VARCHAR(255) NULL,
  reset_token_expires DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reg_no VARCHAR(50) UNIQUE NOT NULL,
  name_model VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  max_capacity_kg DECIMAL(10,2) NOT NULL,
  odometer DECIMAL(10,2) DEFAULT 0,
  acquisition_cost DECIMAL(12,2) NOT NULL,
  status ENUM('Available','On Trip','In Shop','Retired') DEFAULT 'Available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  license_no VARCHAR(50) UNIQUE NOT NULL,
  license_category VARCHAR(20),
  license_expiry DATE NOT NULL,
  contact_no VARCHAR(20),
  email VARCHAR(150) NULL,
  safety_score DECIMAL(5,2) DEFAULT 100,
  status ENUM('Available','On Trip','Off Duty','Suspended') DEFAULT 'Available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_code VARCHAR(20) UNIQUE NOT NULL,
  source VARCHAR(150) NOT NULL,
  destination VARCHAR(150) NOT NULL,
  vehicle_id INT NOT NULL,
  driver_id INT NOT NULL,
  cargo_weight_kg DECIMAL(10,2) NOT NULL,
  planned_distance_km DECIMAL(10,2) NOT NULL,
  final_odometer DECIMAL(10,2) NULL,
  fuel_consumed_l DECIMAL(10,2) NULL,
  status ENUM('Draft','Dispatched','Completed','Cancelled') DEFAULT 'Draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

CREATE TABLE maintenance_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  service_date DATE NOT NULL,
  status ENUM('Active','Completed') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

CREATE TABLE fuel_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  trip_id INT NULL,
  liters DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  log_date DATE NOT NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (trip_id) REFERENCES trips(id)
);

CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  trip_id INT NULL,
  toll DECIMAL(10,2) DEFAULT 0,
  misc DECIMAL(10,2) DEFAULT 0,
  expense_date DATE NOT NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (trip_id) REFERENCES trips(id)
);
