-- Brightloop Software: Subscription Management System Database Schema
-- MySQL 8.0+ Relational Schema with Foreign Keys, Constraints, and Indexes

CREATE DATABASE IF NOT EXISTS `brightloop_sms` 
DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `brightloop_sms`;

-- 1. Users Table (Admin, Staff, Customer logins)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NULL,
  `role` ENUM('admin', 'staff', 'customer') NOT NULL DEFAULT 'customer',
  `phone` VARCHAR(30) NULL,
  `oauth_provider` VARCHAR(50) NULL,
  `oauth_id` VARCHAR(191) NULL,
  `avatar_url` VARCHAR(255) NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Customers Table
CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `customer_code` VARCHAR(50) NOT NULL UNIQUE,
  `company_name` VARCHAR(150) NULL,
  `contact_name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(30) NULL,
  `billing_address` TEXT NULL,
  `shipping_address` TEXT NULL,
  `tax_id` VARCHAR(50) NULL, -- e.g., GSTIN / VAT ID
  `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_customers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_customers_email` (`email`),
  INDEX `idx_customers_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Staff Table
CREATE TABLE IF NOT EXISTS `staff` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `employee_code` VARCHAR(50) NOT NULL UNIQUE,
  `department` VARCHAR(100) NOT NULL DEFAULT 'Customer Operations',
  `designation` VARCHAR(100) NOT NULL DEFAULT 'Subscription Specialist',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_staff_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Products Table
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `product_type` ENUM('saas_subscription', 'software_license', 'cloud_hosting', 'support_addon', 'service') NOT NULL DEFAULT 'saas_subscription',
  `sales_price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `cost_price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `description` TEXT NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_products_type` (`product_type`),
  INDEX `idx_products_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Product Variants Table
CREATE TABLE IF NOT EXISTS `product_variants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `variant_name` VARCHAR(120) NOT NULL, -- e.g., 'Standard', 'Odoo Integration Edition', 'AWS Dedicated'
  `sku` VARCHAR(60) NOT NULL UNIQUE,
  `additional_price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_variants_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  INDEX `idx_variants_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Subscription Plans Table
CREATE TABLE IF NOT EXISTS `subscription_plans` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `plan_code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `product_id` INT NOT NULL,
  `variant_id` INT NULL,
  `price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `billing_frequency` ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL DEFAULT 'monthly',
  `min_quantity` INT NOT NULL DEFAULT 1,
  `start_date` DATE NOT NULL,
  `end_date` DATE NULL,
  `auto_close` TINYINT(1) NOT NULL DEFAULT 0,
  `early_closure_allowed` TINYINT(1) NOT NULL DEFAULT 1,
  `pause_allowed` TINYINT(1) NOT NULL DEFAULT 1,
  `renewal_allowed` TINYINT(1) NOT NULL DEFAULT 1,
  `description` TEXT NULL,
  `status` ENUM('active', 'inactive', 'archived') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_plans_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_plans_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE RESTRICT,
  INDEX `idx_plans_freq` (`billing_frequency`),
  INDEX `idx_plans_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tax Rules Table
CREATE TABLE IF NOT EXISTS `tax_rules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL, -- e.g., 'GST 18%', 'VAT 5%', 'Exempt 0%'
  `percentage` DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
  `tax_type` ENUM('exclusive', 'inclusive') NOT NULL DEFAULT 'exclusive',
  `start_date` DATE NOT NULL,
  `end_date` DATE NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_tax_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Discounts Table
CREATE TABLE IF NOT EXISTS `discounts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `discount_type` ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
  `discount_value` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `min_purchase_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `min_quantity` INT NOT NULL DEFAULT 1,
  `applicable_product_id` INT NULL,
  `applicable_plan_id` INT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NULL,
  `max_usage_count` INT NOT NULL DEFAULT 100,
  `current_usage_count` INT NOT NULL DEFAULT 0,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_discounts_product` FOREIGN KEY (`applicable_product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_discounts_plan` FOREIGN KEY (`applicable_plan_id`) REFERENCES `subscription_plans` (`id`) ON DELETE SET NULL,
  INDEX `idx_discounts_code` (`code`),
  INDEX `idx_discounts_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Quotations Table
CREATE TABLE IF NOT EXISTS `quotations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `quotation_number` VARCHAR(50) NOT NULL UNIQUE,
  `customer_id` INT NOT NULL,
  `quotation_date` DATE NOT NULL,
  `expiry_date` DATE NOT NULL,
  `subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted') NOT NULL DEFAULT 'draft',
  `notes` TEXT NULL,
  `created_by` INT NULL,
  `converted_subscription_id` INT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_quotations_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_quotations_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_quotations_status` (`status`),
  INDEX `idx_quotations_customer` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Quotation Lines Table
CREATE TABLE IF NOT EXISTS `quotation_lines` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `quotation_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `variant_id` INT NULL,
  `plan_id` INT NULL,
  `description` VARCHAR(255) NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `tax_rate` DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `line_total` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_qlines_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_qlines_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_qlines_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_qlines_plan` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Subscriptions Table
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `subscription_number` VARCHAR(50) NOT NULL UNIQUE,
  `customer_id` INT NOT NULL,
  `plan_id` INT NOT NULL,
  `start_date` DATE NOT NULL,
  `expiry_date` DATE NOT NULL,
  `payment_terms` ENUM('immediate', 'net_15', 'net_30', 'net_60') NOT NULL DEFAULT 'immediate',
  `billing_frequency` ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL DEFAULT 'monthly',
  `next_billing_date` DATE NOT NULL,
  `subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('draft', 'quotation', 'confirmed', 'active', 'paused', 'closed') NOT NULL DEFAULT 'draft',
  `auto_close` TINYINT(1) NOT NULL DEFAULT 0,
  `early_closure_allowed` TINYINT(1) NOT NULL DEFAULT 1,
  `pause_allowed` TINYINT(1) NOT NULL DEFAULT 1,
  `renewal_allowed` TINYINT(1) NOT NULL DEFAULT 1,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_subs_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_subs_plan` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`) ON DELETE RESTRICT,
  INDEX `idx_subs_status` (`status`),
  INDEX `idx_subs_next_billing` (`next_billing_date`),
  INDEX `idx_subs_customer` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Subscription Lines Table
CREATE TABLE IF NOT EXISTS `subscription_lines` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `subscription_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `variant_id` INT NULL,
  `description` VARCHAR(255) NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `tax_rate` DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `line_total` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_slines_subscription` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_slines_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_slines_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Invoices Table
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_number` VARCHAR(50) NOT NULL UNIQUE,
  `customer_id` INT NOT NULL,
  `subscription_id` INT NULL,
  `billing_period_start` DATE NULL,
  `billing_period_end` DATE NULL,
  `invoice_date` DATE NOT NULL,
  `due_date` DATE NOT NULL,
  `subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `amount_paid` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `amount_due` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `payment_status` ENUM('draft', 'unpaid', 'partial', 'paid', 'overdue', 'cancelled') NOT NULL DEFAULT 'unpaid',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_invoices_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_invoices_subscription` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`) ON DELETE SET NULL,
  UNIQUE KEY `uniq_sub_billing_period` (`subscription_id`, `billing_period_start`),
  INDEX `idx_invoices_status` (`payment_status`),
  INDEX `idx_invoices_due_date` (`due_date`),
  INDEX `idx_invoices_customer` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Invoice Lines Table
CREATE TABLE IF NOT EXISTS `invoice_lines` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `variant_id` INT NULL,
  `description` VARCHAR(255) NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `tax_rate` DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `line_total` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_ilines_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ilines_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ilines_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Payments Table
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `payment_number` VARCHAR(50) NOT NULL UNIQUE,
  `invoice_id` INT NOT NULL,
  `customer_id` INT NOT NULL,
  `payment_method` ENUM('upi', 'cash', 'credit_card', 'debit_card', 'bank_transfer') NOT NULL DEFAULT 'bank_transfer',
  `amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `payment_date` DATE NOT NULL,
  `transaction_reference` VARCHAR(100) NULL,
  `notes` TEXT NULL,
  `status` ENUM('completed', 'pending', 'failed', 'refunded') NOT NULL DEFAULT 'completed',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_payments_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_payments_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT,
  INDEX `idx_payments_invoice` (`invoice_id`),
  INDEX `idx_payments_date` (`payment_date`),
  INDEX `idx_payments_method` (`payment_method`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Discount Usage Table
CREATE TABLE IF NOT EXISTS `discount_usage` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `discount_id` INT NOT NULL,
  `customer_id` INT NOT NULL,
  `invoice_id` INT NULL,
  `quotation_id` INT NULL,
  `subscription_id` INT NULL,
  `discount_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `used_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_dusage_discount` FOREIGN KEY (`discount_id`) REFERENCES `discounts` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_dusage_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT,
  INDEX `idx_dusage_discount` (`discount_id`),
  INDEX `idx_dusage_customer` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_resettokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_token_hash` (`token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
