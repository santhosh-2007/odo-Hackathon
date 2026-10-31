-- Brightloop Software: Subscription Management System Seed Data
USE `brightloop_sms`;

-- Disable FK checks during seed load
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `password_reset_tokens`;
TRUNCATE TABLE `discount_usage`;
TRUNCATE TABLE `payments`;
TRUNCATE TABLE `invoice_lines`;
TRUNCATE TABLE `invoices`;
TRUNCATE TABLE `subscription_lines`;
TRUNCATE TABLE `subscriptions`;
TRUNCATE TABLE `quotation_lines`;
TRUNCATE TABLE `quotations`;
TRUNCATE TABLE `discounts`;
TRUNCATE TABLE `tax_rules`;
TRUNCATE TABLE `subscription_plans`;
TRUNCATE TABLE `product_variants`;
TRUNCATE TABLE `products`;
TRUNCATE TABLE `staff`;
TRUNCATE TABLE `customers`;
TRUNCATE TABLE `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users
-- Passwords:
-- Admin: Admin@12345    -> $2a$10$/SYpehYsqmEFZ5Tf.1VYGuK4.T4FqwLb.55h73Rj5yGnMKwy4Hq8G
-- Staff: Staff@12345    -> $2a$10$jZRQjHnoRiZj2ad5IxqYs.dpS5zsmBoz2XK.kp1AUPcTxJu9Bi1Zy
-- Customer: Customer@12345 -> $2a$10$yaqK3Z5kGMHdFaA0vmMLD.NcLaJGh9o6c6.3PuO0lJnL/mIMTRljW
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `status`) VALUES
(1, 'Brightloop Administrator', 'admin@brightloop.com', '$2a$10$/SYpehYsqmEFZ5Tf.1VYGuK4.T4FqwLb.55h73Rj5yGnMKwy4Hq8G', 'admin', '+91 98765 43210', 'active'),
(2, 'Sarah Jenkins', 'staff@brightloop.com', '$2a$10$jZRQjHnoRiZj2ad5IxqYs.dpS5zsmBoz2XK.kp1AUPcTxJu9Bi1Zy', 'staff', '+91 98765 43211', 'active'),
(3, 'Alex Mercer', 'billing@acmecorp.com', '$2a$10$yaqK3Z5kGMHdFaA0vmMLD.NcLaJGh9o6c6.3PuO0lJnL/mIMTRljW', 'customer', '+91 98765 43220', 'active'),
(4, 'Devon Vance', 'ops@techflow.io', '$2a$10$yaqK3Z5kGMHdFaA0vmMLD.NcLaJGh9o6c6.3PuO0lJnL/mIMTRljW', 'customer', '+91 98765 43221', 'active'),
(5, 'Elena Rostova', 'finance@nexuscrm.com', '$2a$10$yaqK3Z5kGMHdFaA0vmMLD.NcLaJGh9o6c6.3PuO0lJnL/mIMTRljW', 'customer', '+91 98765 43222', 'active'),
(6, 'Vikram Malhotra', 'admin@vertexai.co', '$2a$10$yaqK3Z5kGMHdFaA0vmMLD.NcLaJGh9o6c6.3PuO0lJnL/mIMTRljW', 'customer', '+91 98765 43223', 'active');

-- 2. Staff Details
INSERT INTO `staff` (`id`, `user_id`, `employee_code`, `department`, `designation`) VALUES
(1, 2, 'STF-BL-001', 'Subscription & Billing Operations', 'Senior Billing Specialist');

-- 3. Customers Details
INSERT INTO `customers` (`id`, `user_id`, `customer_code`, `company_name`, `contact_name`, `email`, `phone`, `billing_address`, `shipping_address`, `tax_id`, `currency`, `status`) VALUES
(1, 3, 'CUST-BL-001', 'Acme Corporation Pvt Ltd', 'Alex Mercer', 'billing@acmecorp.com', '+91 98765 43220', 'Floor 8, Tower B, Cyber City, Gurugram, HR 122002', 'Floor 8, Tower B, Cyber City, Gurugram, HR 122002', '06AAACA1234F1Z5', 'INR', 'active'),
(2, 4, 'CUST-BL-002', 'TechFlow Solutions Inc', 'Devon Vance', 'ops@techflow.io', '+91 98765 43221', '402 Prestige Silicon Bay, Whitefield, Bengaluru, KA 560066', '402 Prestige Silicon Bay, Whitefield, Bengaluru, KA 560066', '29AABCT9876M1ZB', 'INR', 'active'),
(3, 5, 'CUST-BL-003', 'Nexus Enterprise Systems', 'Elena Rostova', 'finance@nexuscrm.com', '+91 98765 43222', 'Plot 18, Phase 2, HITEC City, Hyderabad, TG 500081', 'Plot 18, Phase 2, HITEC City, Hyderabad, TG 500081', '36AAACN5432P1ZQ', 'INR', 'active'),
(4, 6, 'CUST-BL-004', 'Vertex AI Labs', 'Vikram Malhotra', 'admin@vertexai.co', '+91 98765 43223', 'Level 4, Express Towers, Nariman Point, Mumbai, MH 400021', 'Level 4, Express Towers, Nariman Point, Mumbai, MH 400021', '27AABCV3322K1Z9', 'INR', 'active');

-- 4. Products
INSERT INTO `products` (`id`, `product_code`, `name`, `product_type`, `sales_price`, `cost_price`, `description`, `status`) VALUES
(1, 'PRD-BL-001', 'Brightloop Cloud ERP Core', 'saas_subscription', 1000.00, 400.00, 'Comprehensive Cloud ERP modular platform featuring Finance, Invoicing, Inventory, and CRM sync.', 'active'),
(2, 'PRD-BL-002', 'Brightloop CRM Pro', 'saas_subscription', 800.00, 300.00, 'Customer relationship, pipeline automation, and multi-channel lead tracking suite.', 'active'),
(3, 'PRD-BL-003', 'Brightloop BI & Analytics Engine', 'saas_subscription', 2500.00, 1100.00, 'AI-driven reporting dashboards, data warehousing connectors, and real-time visualization.', 'active'),
(4, 'PRD-BL-004', 'High-Availability Cloud Cluster', 'cloud_hosting', 5000.00, 2200.00, 'Dedicated isolated cloud Kubernetes cluster with 99.99% uptime SLA and disaster recovery.', 'active'),
(5, 'PRD-BL-005', '24/7 Mission-Critical Support', 'support_addon', 400.00, 150.00, 'Direct phone line and dedicated solutions architect with 15-minute response SLA.', 'active');

-- 5. Product Variants (e.g., Odoo Brand Variant: Base 1,000 + Odoo Brand 560 = 1,560)
INSERT INTO `product_variants` (`id`, `product_id`, `variant_name`, `sku`, `additional_price`, `status`) VALUES
(1, 1, 'Standard Cloud Edition', 'SKU-ERP-STD', 0.00, 'active'),
(2, 1, 'Odoo Brand Integration Edition', 'SKU-ERP-ODOO', 560.00, 'active'),
(3, 1, 'Enterprise Multi-Company Edition', 'SKU-ERP-ENT', 1200.00, 'active'),
(4, 2, 'Standard CRM Edition', 'SKU-CRM-STD', 0.00, 'active'),
(5, 2, 'Omnichannel WhatsApp & SMS Edition', 'SKU-CRM-OMNI', 450.00, 'active'),
(6, 3, 'Standard Reporting Tier', 'SKU-BI-STD', 0.00, 'active'),
(7, 3, 'Real-Time Streaming Tier', 'SKU-BI-STREAM', 800.00, 'active');

-- 6. Subscription Plans
INSERT INTO `subscription_plans` (`id`, `plan_code`, `name`, `product_id`, `variant_id`, `price`, `billing_frequency`, `min_quantity`, `start_date`, `end_date`, `auto_close`, `early_closure_allowed`, `pause_allowed`, `renewal_allowed`, `description`, `status`) VALUES
(1, 'PLAN-ERP-MTH-ODOO', 'Brightloop ERP Odoo Edition Monthly', 1, 2, 1560.00, 'monthly', 1, '2026-01-01', NULL, 0, 1, 1, 1, 'Full ERP suite bundled with Odoo brand synchronization connector at ₹1,560 per seat/month.', 'active'),
(2, 'PLAN-ERP-YR-ODOO', 'Brightloop ERP Odoo Edition Annual', 1, 2, 16000.00, 'yearly', 1, '2026-01-01', NULL, 0, 1, 1, 1, 'Annual subscription for ERP Odoo edition with 2 months free discount.', 'active'),
(3, 'PLAN-CRM-MTH', 'Brightloop CRM Pro Monthly', 2, 4, 800.00, 'monthly', 1, '2026-01-01', NULL, 0, 1, 1, 1, 'Flexible monthly billing for high-growth sales teams.', 'active'),
(4, 'PLAN-BI-STREAM-MTH', 'Analytics Real-Time Stream Monthly', 3, 7, 3300.00, 'monthly', 1, '2026-01-01', NULL, 0, 1, 1, 1, 'Real-time telemetry and advanced analytics engine with data stream support.', 'active'),
(5, 'PLAN-TRIAL-DAILY', '7-Day Full Trial Sandbox', 1, 1, 100.00, 'daily', 1, '2026-01-01', NULL, 1, 1, 0, 0, 'Automated short-term evaluation environment.', 'active');

-- 7. Tax Rules
INSERT INTO `tax_rules` (`id`, `name`, `percentage`, `tax_type`, `start_date`, `end_date`, `status`) VALUES
(1, 'Standard GST 18%', 18.00, 'exclusive', '2024-01-01', NULL, 'active'),
(2, 'Software Concessional GST 12%', 12.00, 'exclusive', '2024-01-01', NULL, 'active'),
(3, 'Global VAT 5%', 5.00, 'exclusive', '2024-01-01', NULL, 'active'),
(4, 'Zero Tax / SEZ Export Exempt', 0.00, 'exclusive', '2024-01-01', NULL, 'active');

-- 8. Discounts
INSERT INTO `discounts` (`id`, `code`, `name`, `discount_type`, `discount_value`, `min_purchase_amount`, `min_quantity`, `applicable_product_id`, `applicable_plan_id`, `start_date`, `end_date`, `max_usage_count`, `current_usage_count`, `status`) VALUES
(1, 'WELCOME10', 'New Customer 10% Welcome Discount', 'percentage', 10.00, 500.00, 1, NULL, NULL, '2026-01-01', '2026-12-31', 100, 2, 'active'),
(2, 'FLAT500', 'Enterprise Launch Flat ₹500 Off', 'fixed', 500.00, 2000.00, 1, NULL, NULL, '2026-01-01', '2026-12-31', 50, 1, 'active'),
(3, 'ANNUAL25', 'Annual Commitment 25% Off', 'percentage', 25.00, 10000.00, 1, NULL, NULL, '2026-01-01', '2026-12-31', 25, 0, 'active');

-- 9. Quotations
INSERT INTO `quotations` (`id`, `quotation_number`, `customer_id`, `quotation_date`, `expiry_date`, `subtotal`, `tax_amount`, `discount_amount`, `total_amount`, `status`, `notes`, `created_by`, `converted_subscription_id`) VALUES
(1, 'QT-2026-0001', 1, '2026-10-01', '2026-11-01', 3120.00, 561.60, 0.00, 3681.60, 'converted', 'Quotation converted successfully into subscription SUB-2026-0001.', 1, 1),
(2, 'QT-2026-0002', 2, '2026-10-15', '2026-11-15', 1600.00, 288.00, 160.00, 1728.00, 'sent', 'Brightloop CRM Pro 2 user license quotation with WELCOME10 applied.', 2, NULL),
(3, 'QT-2026-0003', 4, '2026-10-25', '2026-11-25', 5000.00, 900.00, 500.00, 5400.00, 'draft', 'Draft proposal for High-Availability Cluster hosting.', 1, NULL);

INSERT INTO `quotation_lines` (`id`, `quotation_id`, `product_id`, `variant_id`, `plan_id`, `description`, `quantity`, `unit_price`, `tax_rate`, `tax_amount`, `discount_amount`, `line_total`) VALUES
(1, 1, 1, 2, 1, 'Brightloop Cloud ERP - Odoo Brand Integration Edition (2 Seats)', 2, 1560.00, 18.00, 561.60, 0.00, 3681.60),
(2, 2, 2, 4, 3, 'Brightloop CRM Pro - Standard CRM Edition (2 Seats)', 2, 800.00, 18.00, 288.00, 160.00, 1728.00),
(3, 3, 4, NULL, NULL, 'Dedicated High-Availability Cloud Cluster with 99.99% SLA', 1, 5000.00, 18.00, 900.00, 500.00, 5400.00);

-- 10. Subscriptions
INSERT INTO `subscriptions` (`id`, `subscription_number`, `customer_id`, `plan_id`, `start_date`, `expiry_date`, `payment_terms`, `billing_frequency`, `next_billing_date`, `subtotal`, `tax_amount`, `discount_amount`, `total_amount`, `status`, `auto_close`, `early_closure_allowed`, `pause_allowed`, `renewal_allowed`, `notes`) VALUES
(1, 'SUB-2026-0001', 1, 1, '2026-10-01', '2027-10-01', 'immediate', 'monthly', '2026-11-01', 3120.00, 561.60, 0.00, 3681.60, 'active', 0, 1, 1, 1, 'Converted from QT-2026-0001. ERP 2 Seats Odoo Edition.'),
(2, 'SUB-2026-0002', 2, 3, '2026-09-15', '2027-09-15', 'net_15', 'monthly', '2026-10-15', 1600.00, 288.00, 160.00, 1728.00, 'active', 0, 1, 1, 1, 'TechFlow Solutions CRM team subscription.'),
(3, 'SUB-2026-0003', 3, 4, '2026-08-01', '2027-08-01', 'net_30', 'monthly', '2026-11-01', 3300.00, 594.00, 0.00, 3894.00, 'paused', 0, 1, 1, 1, 'Temporarily paused per client request during infrastructure migration.'),
(4, 'SUB-2026-0004', 4, 1, '2026-01-01', '2026-07-01', 'immediate', 'monthly', '2026-07-01', 1560.00, 280.80, 0.00, 1840.80, 'closed', 1, 1, 1, 0, 'Historical subscription completed and closed at term expiry.'),
(5, 'SUB-2026-0005', 4, 3, '2026-11-01', '2027-11-01', 'immediate', 'monthly', '2026-11-01', 800.00, 144.00, 0.00, 944.00, 'confirmed', 0, 1, 1, 1, 'Confirmed subscription scheduled for activation.');

INSERT INTO `subscription_lines` (`id`, `subscription_id`, `product_id`, `variant_id`, `description`, `quantity`, `unit_price`, `tax_rate`, `tax_amount`, `discount_amount`, `line_total`) VALUES
(1, 1, 1, 2, 'Brightloop Cloud ERP - Odoo Brand Integration Edition', 2, 1560.00, 18.00, 561.60, 0.00, 3681.60),
(2, 2, 2, 4, 'Brightloop CRM Pro - Standard Edition', 2, 800.00, 18.00, 288.00, 160.00, 1728.00),
(3, 3, 3, 7, 'Brightloop Analytics Engine - Streaming Tier', 1, 3300.00, 18.00, 594.00, 0.00, 3894.00),
(4, 4, 1, 2, 'Brightloop Cloud ERP - Odoo Brand Integration Edition', 1, 1560.00, 18.00, 280.80, 0.00, 1840.80),
(5, 5, 2, 4, 'Brightloop CRM Pro - Standard Edition', 1, 800.00, 18.00, 144.00, 0.00, 944.00);

-- 11. Invoices
INSERT INTO `invoices` (`id`, `invoice_number`, `customer_id`, `subscription_id`, `billing_period_start`, `billing_period_end`, `invoice_date`, `due_date`, `subtotal`, `tax_amount`, `discount_amount`, `total_amount`, `amount_paid`, `amount_due`, `payment_status`, `notes`) VALUES
(1, 'INV-2026-0001', 1, 1, '2026-10-01', '2026-10-31', '2026-10-01', '2026-10-15', 3120.00, 561.60, 0.00, 3681.60, 3681.60, 0.00, 'paid', 'Initial billing invoice for SUB-2026-0001. Paid in full via Bank Transfer.'),
(2, 'INV-2026-0002', 2, 2, '2026-10-15', '2026-11-14', '2026-10-15', '2026-10-30', 1600.00, 288.00, 160.00, 1728.00, 1000.00, 728.00, 'partial', 'Partial payment of ₹1,000 received via UPI. Balance of ₹728 outstanding.'),
(3, 'INV-2026-0003', 3, 3, '2026-09-01', '2026-09-30', '2026-09-01', '2026-09-15', 3300.00, 594.00, 0.00, 3894.00, 0.00, 3894.00, 'overdue', 'Overdue monthly invoice. Automated reminder dispatched.'),
(4, 'INV-2026-0004', 4, NULL, NULL, NULL, '2026-10-28', '2026-11-12', 1000.00, 180.00, 0.00, 1180.00, 0.00, 1180.00, 'unpaid', 'Professional cloud onboarding service invoice.');

INSERT INTO `invoice_lines` (`id`, `invoice_id`, `product_id`, `variant_id`, `description`, `quantity`, `unit_price`, `tax_rate`, `tax_amount`, `discount_amount`, `line_total`) VALUES
(1, 1, 1, 2, 'Brightloop Cloud ERP - Odoo Brand Integration Edition (Billing Period: Oct 1 - Oct 31)', 2, 1560.00, 18.00, 561.60, 0.00, 3681.60),
(2, 2, 2, 4, 'Brightloop CRM Pro - Standard Edition (Billing Period: Oct 15 - Nov 14)', 2, 800.00, 18.00, 288.00, 160.00, 1728.00),
(3, 3, 3, 7, 'Brightloop Analytics Engine - Streaming Tier (Billing Period: Sep 1 - Sep 30)', 1, 3300.00, 18.00, 594.00, 0.00, 3894.00),
(4, 4, 1, 1, 'Cloud ERP Onboarding & Setup Architecture Consultation', 1, 1000.00, 18.00, 180.00, 0.00, 1180.00);

-- 12. Payments
INSERT INTO `payments` (`id`, `payment_number`, `invoice_id`, `customer_id`, `payment_method`, `amount`, `payment_date`, `transaction_reference`, `notes`, `status`) VALUES
(1, 'PAY-2026-0001', 1, 1, 'bank_transfer', 3681.60, '2026-10-02', 'HDFC-NEFT-88492019', 'Full invoice settlement received in Brightloop HDFC Current A/C.', 'completed'),
(2, 'PAY-2026-0002', 2, 2, 'upi', 1000.00, '2026-10-20', 'UPI-REF-993821039821', 'Partial payment via Google Pay UPI. Balance remaining: ₹728.00.', 'completed');

-- 13. Discount Usage
INSERT INTO `discount_usage` (`id`, `discount_id`, `customer_id`, `invoice_id`, `quotation_id`, `subscription_id`, `discount_amount`, `used_at`) VALUES
(1, 1, 2, 2, 2, 2, 160.00, '2026-10-15 11:30:00');
