-- CarePoint / Healthcare Dispensary Management System
-- Schema generated from the supplied MySQL Workbench model (dis.mwb).
-- This creates the 16-table structure only; it does not insert directory or demo records.
-- Generated from the supplied MySQL Workbench model (dis.mwb).
-- Import into a NEW/empty database. Back up an existing database before applying changes.

CREATE DATABASE IF NOT EXISTS `dispensary_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `dispensary_db`;

CREATE TABLE IF NOT EXISTS `app_user` (
  `user_id` INT NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NULL DEFAULT NULL,
  `role` ENUM('client', 'dispensary_admin', 'super_admin') NOT NULL DEFAULT 'client',
  `managed_dispensary_id` INT NULL DEFAULT NULL,
  `is_active` TINYINT NOT NULL DEFAULT '1',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_app_user_email` (`email`),
  KEY `idx_app_user_managed_dispensary` (`managed_dispensary_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `appointment_request` (
  `appointment_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `dispensary_id` INT NOT NULL,
  `service_id` INT NULL DEFAULT NULL,
  `preferred_date` DATE NOT NULL,
  `time_slot` ENUM('morning', 'afternoon', 'evening') NOT NULL,
  `reason` VARCHAR(500) NULL DEFAULT NULL,
  `status` ENUM('pending', 'confirmed', 'rejected', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  `admin_remarks` VARCHAR(500) NULL DEFAULT NULL,
  `processed_by` INT NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `processed_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`appointment_id`),
  KEY `idx_appointment_user` (`user_id`),
  KEY `idx_appointment_dispensary_status` (`dispensary_id`, `status`),
  KEY `idx_appointment_service_mapping` (`dispensary_id`, `service_id`),
  KEY `fk_appointment_processed_by` (`processed_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `audit_log` (
  `log_id` BIGINT NOT NULL AUTO_INCREMENT,
  `admin_id` INT NOT NULL,
  `action_type` VARCHAR(40) NOT NULL,
  `entity_type` VARCHAR(40) NOT NULL,
  `entity_id` VARCHAR(50) NULL DEFAULT NULL,
  `details` JSON NULL DEFAULT NULL,
  `ip_address` VARCHAR(45) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_audit_admin_time` (`admin_id`, `created_at`),
  KEY `idx_audit_entity` (`entity_type`, `entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `dispensary` (
  `dispensary_id` INT NOT NULL AUTO_INCREMENT,
  `dispensary_name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NULL DEFAULT NULL,
  `provider_type` VARCHAR(100) NULL DEFAULT NULL,
  `address` VARCHAR(500) NULL DEFAULT NULL,
  `pincode` VARCHAR(20) NULL DEFAULT NULL,
  `telephone` VARCHAR(100) NULL DEFAULT NULL,
  `district_id` INT NULL DEFAULT NULL,
  PRIMARY KEY (`dispensary_id`),
  KEY `district_id` (`district_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `dispensary_extra` (
  `dispensary_id` INT NOT NULL,
  `mobile_number` VARCHAR(100) NULL DEFAULT NULL,
  `website` VARCHAR(255) NULL DEFAULT NULL,
  `latitude` DECIMAL(9,6) NULL DEFAULT NULL,
  `longitude` DECIMAL(9,6) NULL DEFAULT NULL,
  PRIMARY KEY (`dispensary_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `dispensary_inventory` (
  `dispensary_id` INT NOT NULL,
  `medicine_id` INT NOT NULL,
  `quantity_on_hand` INT NOT NULL DEFAULT '0',
  `reorder_level` INT NOT NULL DEFAULT '10',
  `is_demo` TINYINT NOT NULL DEFAULT '1',
  `last_updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`dispensary_id`, `medicine_id`),
  KEY `idx_inventory_medicine` (`medicine_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `dispensary_raw` (
  `sr_no` INT NULL DEFAULT NULL,
  `hospital_name` VARCHAR(255) NULL DEFAULT NULL,
  `category` VARCHAR(100) NULL DEFAULT NULL,
  `provider_type` VARCHAR(100) NULL DEFAULT NULL,
  `address` VARCHAR(500) NULL DEFAULT NULL,
  `state` VARCHAR(100) NULL DEFAULT NULL,
  `district` VARCHAR(100) NULL DEFAULT NULL,
  `subdistrict` VARCHAR(100) NULL DEFAULT NULL,
  `pincode` VARCHAR(20) NULL DEFAULT NULL,
  `telephone` VARCHAR(100) NULL DEFAULT NULL,
  `total_beds` VARCHAR(50) NULL DEFAULT NULL,
  `mobile` VARCHAR(100) NULL DEFAULT NULL,
  `website` VARCHAR(255) NULL DEFAULT NULL,
  `latitude` VARCHAR(50) NULL DEFAULT NULL,
  `longitude` VARCHAR(50) NULL DEFAULT NULL,
  `ayush_service` VARCHAR(255) NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `dispensary_service` (
  `dispensary_id` INT NOT NULL,
  `service_id` INT NOT NULL,
  PRIMARY KEY (`dispensary_id`, `service_id`),
  KEY `fk_dispensary_service_service` (`service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `district` (
  `district_id` INT NOT NULL AUTO_INCREMENT,
  `district_name` VARCHAR(100) NOT NULL,
  `state_id` INT NOT NULL,
  PRIMARY KEY (`district_id`),
  KEY `state_id` (`state_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `feedback` (
  `feedback_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `dispensary_id` INT NOT NULL,
  `rating` TINYINT NOT NULL,
  `comment` VARCHAR(1000) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`feedback_id`),
  UNIQUE KEY `uq_feedback_user_dispensary` (`user_id`, `dispensary_id`),
  KEY `idx_feedback_dispensary` (`dispensary_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `healthcare_service` (
  `service_id` INT NOT NULL AUTO_INCREMENT,
  `service_name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`service_id`),
  UNIQUE KEY `service_name` (`service_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `medicine` (
  `medicine_id` INT NOT NULL AUTO_INCREMENT,
  `medicine_name` VARCHAR(150) NOT NULL,
  `generic_name` VARCHAR(150) NULL DEFAULT NULL,
  `category` VARCHAR(80) NULL DEFAULT NULL,
  `dosage_form` VARCHAR(40) NULL DEFAULT NULL,
  `strength` VARCHAR(50) NULL DEFAULT NULL,
  `requires_prescription` TINYINT NOT NULL DEFAULT '0',
  `is_demo` TINYINT NOT NULL DEFAULT '1',
  `is_active` TINYINT NOT NULL DEFAULT '1',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`medicine_id`),
  UNIQUE KEY `uq_medicine_catalog` (`medicine_name`, `strength`, `dosage_form`),
  KEY `idx_medicine_name` (`medicine_name`),
  KEY `idx_medicine_generic_name` (`generic_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `medicine_request` (
  `request_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `dispensary_id` INT NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected', 'dispensed', 'cancelled') NOT NULL DEFAULT 'pending',
  `client_remarks` VARCHAR(500) NULL DEFAULT NULL,
  `admin_remarks` VARCHAR(500) NULL DEFAULT NULL,
  `processed_by` INT NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `processed_at` DATETIME NULL DEFAULT NULL,
  `dispensed_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`request_id`),
  KEY `idx_medicine_request_user` (`user_id`),
  KEY `idx_medicine_request_dispensary_status` (`dispensary_id`, `status`),
  KEY `fk_medicine_request_processed_by` (`processed_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `medicine_request_item` (
  `request_id` INT NOT NULL,
  `medicine_id` INT NOT NULL,
  `quantity_requested` INT NOT NULL,
  `quantity_approved` INT NULL DEFAULT NULL,
  `quantity_dispensed` INT NOT NULL DEFAULT '0',
  PRIMARY KEY (`request_id`, `medicine_id`),
  KEY `idx_request_item_medicine` (`medicine_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `state` (
  `state_id` INT NOT NULL AUTO_INCREMENT,
  `state_name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`state_id`),
  UNIQUE KEY `state_name` (`state_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `stock_transactions` (
  `txn_id` BIGINT NOT NULL AUTO_INCREMENT,
  `dispensary_id` INT NOT NULL,
  `medicine_id` INT NOT NULL,
  `txn_type` ENUM('opening', 'restock', 'dispense', 'adjustment') NOT NULL,
  `quantity_change` INT NOT NULL,
  `quantity_after` INT NOT NULL,
  `request_id` INT NULL DEFAULT NULL,
  `performed_by` INT NOT NULL,
  `remarks` VARCHAR(255) NULL DEFAULT NULL,
  `txn_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`txn_id`),
  KEY `idx_stock_txn_inventory` (`dispensary_id`, `medicine_id`, `txn_time`),
  KEY `idx_stock_txn_request` (`request_id`),
  KEY `idx_stock_txn_performed_by` (`performed_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE `app_user` ADD CONSTRAINT `fk_app_user_managed_dispensary` FOREIGN KEY (`managed_dispensary_id`) REFERENCES `dispensary` (`dispensary_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `appointment_request` ADD CONSTRAINT `fk_appointment_dispensary` FOREIGN KEY (`dispensary_id`) REFERENCES `dispensary` (`dispensary_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `appointment_request` ADD CONSTRAINT `fk_appointment_processed_by` FOREIGN KEY (`processed_by`) REFERENCES `app_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `appointment_request` ADD CONSTRAINT `fk_appointment_service_mapping` FOREIGN KEY (`dispensary_id`, `service_id`) REFERENCES `dispensary_service` (`dispensary_id`, `service_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `appointment_request` ADD CONSTRAINT `fk_appointment_user` FOREIGN KEY (`user_id`) REFERENCES `app_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `audit_log` ADD CONSTRAINT `fk_audit_admin` FOREIGN KEY (`admin_id`) REFERENCES `app_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `dispensary` ADD CONSTRAINT `dispensary_ibfk_1` FOREIGN KEY (`district_id`) REFERENCES `district` (`district_id`);
ALTER TABLE `dispensary_extra` ADD CONSTRAINT `fk_dispensary_extra_dispensary` FOREIGN KEY (`dispensary_id`) REFERENCES `dispensary` (`dispensary_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `dispensary_inventory` ADD CONSTRAINT `fk_inventory_dispensary` FOREIGN KEY (`dispensary_id`) REFERENCES `dispensary` (`dispensary_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `dispensary_inventory` ADD CONSTRAINT `fk_inventory_medicine` FOREIGN KEY (`medicine_id`) REFERENCES `medicine` (`medicine_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `dispensary_service` ADD CONSTRAINT `dispensary_service_ibfk_1` FOREIGN KEY (`dispensary_id`) REFERENCES `dispensary` (`dispensary_id`);
ALTER TABLE `dispensary_service` ADD CONSTRAINT `fk_dispensary_service_service` FOREIGN KEY (`service_id`) REFERENCES `healthcare_service` (`service_id`);
ALTER TABLE `district` ADD CONSTRAINT `district_ibfk_1` FOREIGN KEY (`state_id`) REFERENCES `state` (`state_id`);
ALTER TABLE `feedback` ADD CONSTRAINT `fk_feedback_dispensary` FOREIGN KEY (`dispensary_id`) REFERENCES `dispensary` (`dispensary_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `feedback` ADD CONSTRAINT `fk_feedback_user` FOREIGN KEY (`user_id`) REFERENCES `app_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `medicine_request` ADD CONSTRAINT `fk_medicine_request_dispensary` FOREIGN KEY (`dispensary_id`) REFERENCES `dispensary` (`dispensary_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `medicine_request` ADD CONSTRAINT `fk_medicine_request_processed_by` FOREIGN KEY (`processed_by`) REFERENCES `app_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `medicine_request` ADD CONSTRAINT `fk_medicine_request_user` FOREIGN KEY (`user_id`) REFERENCES `app_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `medicine_request_item` ADD CONSTRAINT `fk_request_item_medicine` FOREIGN KEY (`medicine_id`) REFERENCES `medicine` (`medicine_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `medicine_request_item` ADD CONSTRAINT `fk_request_item_request` FOREIGN KEY (`request_id`) REFERENCES `medicine_request` (`request_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `stock_transactions` ADD CONSTRAINT `fk_stock_txn_inventory` FOREIGN KEY (`dispensary_id`, `medicine_id`) REFERENCES `dispensary_inventory` (`dispensary_id`, `medicine_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `stock_transactions` ADD CONSTRAINT `fk_stock_txn_performed_by` FOREIGN KEY (`performed_by`) REFERENCES `app_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `stock_transactions` ADD CONSTRAINT `fk_stock_txn_request` FOREIGN KEY (`request_id`) REFERENCES `medicine_request` (`request_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
