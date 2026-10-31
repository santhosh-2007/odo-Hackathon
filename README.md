# Brightloop Software — Subscription Management System

A commercial-grade, fully functional full-stack web application built for **Brightloop Software** to manage SaaS subscriptions, product variants, quotations, recurring automated invoicing, tax rules, discount codes, partial payment collections, and financial analytics.

---

## 🚀 Key Features & Highlights

- **Role-Based Access Control (RBAC)**: Dedicated workspaces for **Admin**, **Staff**, and **Customer** roles with strict route & API guards.
- **Product & Dynamic Variant Architecture**: Base products (SaaS, licenses, hosting) with configurable variants (e.g., *Standard*, *Odoo Brand Integration*, *Enterprise*). Automated formula pricing (e.g., Base ₹1,000 + Odoo ₹560 = ₹1,560).
- **Subscription Lifecycle Management**: Full state transition workflow: `Draft` → `Quotation` → `Confirmed` → `Active` → `Paused` → `Resumed` → `Closed` → `Renewed`.
- **1-Click Quotation Conversion**: Create multi-line commercial proposals with tax & discount calculations, and convert accepted quotations into active subscriptions without re-entering data.
- **Automated Recurring Billing Engine**: Idempotent billing runner that scans active subscriptions, prevents duplicate invoices for the same period, advances billing dates based on frequency (daily, weekly, monthly, yearly), and auto-detects overdue invoices.
- **Partial & Full Payment Tracking**: Record payments across UPI, Bank Transfer (NEFT/RTGS), Credit Card, Debit Card, and Cash with overpayment protection and balance calculations.
- **PDF Invoicing & Printable Views**: Generate branded tax invoices with download stream and browser-native printing.
- **Real-Time Analytics & Reporting**: 8 dedicated reports with date range filtering, summary KPI cards, and 1-click CSV export.

---

## 🛠 Technology Stack

### Frontend
- **React.js 18** with **Vite**
- **Tailwind CSS** (Custom Dark Navy `#0F172A`, Blue `#2563EB`, Purple `#7C3AED` SaaS theme)
- **React Router v6** (Nested layouts and role-based protected route guards)
- **Axios** (JWT interceptors and error handling)
- **Recharts** (Area, Bar, Donut, and Composed charts)
- **Lucide React** (Modern iconography)

### Backend
- **Node.js** & **Express.js** (REST API architecture)
- **MySQL2 (Promise-based)** with connection pooling and transactions
- **JWT (JSON Web Tokens)** for stateless authentication
- **bcryptjs** for secure password hashing
- **PDFKit** for PDF invoice generation
- **Morgan** for HTTP logging

### Database
- **MySQL 8.0+** relational database
- 17 normalized tables with foreign key constraints, indexes, and cascades

---

## 🗄 Database Architecture (17 Tables)

1. `users` — Authentication credentials, role, status
2. `customers` — Enterprise client profiles, tax ID / GSTIN, billing addresses
3. `staff` — Employee records, departmental assignments, designations
4. `products` — Base offerings (SaaS subscriptions, licenses, hosting, addons)
5. `product_variants` — Variants, brand editions (e.g. Odoo Edition), additional price
6. `subscription_plans` — Billing frequency, rules (auto-close, early closure, pause, renewal)
7. `tax_rules` — GST & VAT rates (exclusive & inclusive)
8. `discounts` — Percentage & flat discount campaigns, eligibility limits, usage limits
9. `discount_usage` — Historical coupon redemption logs
10. `quotations` — Commercial proposals with validity dates and conversion references
11. `quotation_lines` — Multi-item proposal lines with tax and line totals
12. `subscriptions` — Master contracts, next billing dates, terms, and lifecycle states
13. `subscription_lines` — Licensed products and variant lines attached to subscriptions
14. `invoices` — Tax invoices, billing periods, amount paid, and outstanding balance
15. `invoice_lines` — Itemized billing lines
16. `payments` — Transaction logs, payment methods, UTR references, partial amounts
17. `password_reset_tokens` — Secure expiring crypto tokens for password recovery

---

## 🔐 Sample Login Credentials

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@brightloop.com` | `Admin@12345` | Complete system access: User management, tax & discount rules, full financial reports, catalog editing |
| **Staff** | `staff@brightloop.com` | `Staff@12345` | Operations access: CRM customer management, quotation creation, subscription lifecycle, payments, invoices |
| **Customer** | `billing@acmecorp.com` | `Customer@12345` | Customer Portal: View subscriptions, invoices, download PDFs, view payment history, accept quotations |
| **Customer 2** | `ops@techflow.io` | `Customer@12345` | TechFlow Solutions self-service account |

*Note: The login screen also features 1-click quick login buttons for all three roles.*

---

## ⚙️ Installation & Setup Instructions

### Prerequisites
- Node.js (v18+ recommended, tested on Node v24)
- npm (v9+)
- MySQL Server (v8.0+ running locally or remotely)

### 1. Database Configuration
By default, the application is configured to connect to MySQL on `127.0.0.1:3307` (or `3306`).
Configure your credentials in `backend/.env`:

```env
PORT=5000
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=
DB_NAME=brightloop_sms
JWT_SECRET=brightloop_software_super_secure_jwt_token_key_2026
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

### 2. Initialize Database & Seed Sample Data
Run the automated initialization scripts from the root or `backend` folder:

```bash
# Initialize schema (creates database and all 17 tables)
npm run init:db

# Seed rich Brightloop Software sample dataset
npm run seed:db
```

### 3. Start the Backend API Server
```bash
cd backend
npm install
npm run dev
# Server will start on http://localhost:5000
```

### 4. Start the Frontend Client
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
# Frontend will start on http://localhost:5173
```

---

## 🧪 Automated Integration Verification Suite

Run the full end-to-end verification test suite covering all 12 modules against the live database:

```bash
npm run test:system
# or: node backend/scripts/verifySystem.js
```

### Verification Results Summary:
- ✅ **Database Connectivity**: Verified InnoDB transaction and foreign key support.
- ✅ **Password Policy**: Enforced >8 characters, 1 uppercase, 1 lowercase, 1 special character.
- ✅ **Customer Self-Registration**: Created user, linked customer record, and issued JWT.
- ✅ **Role-Based Redirection**: Admin, Staff, and Customer redirected to respective workspaces.
- ✅ **API Access Control (RBAC)**: Blocked unauthorized staff and customer requests with 403 Forbidden.
- ✅ **Product & Variant Pricing**: Verified base price ₹1,000 + Odoo variant ₹560 = ₹1,560.
- ✅ **Quotation Creation & 1-Click Conversion**: Generated quotation and converted directly into active subscription.
- ✅ **Subscription Lifecycle**: Tested Draft → Confirmed → Active → Paused → Resumed → Closed → Renewed.
- ✅ **Recurring Billing Engine**: Generated due invoices without duplicate period records.
- ✅ **Payment Recording & Overpayment Protection**: Handled partial payment, calculated remaining balance due, and prevented overpayment.
- ✅ **PDF Invoice Generation**: Verified PDFKit binary stream with valid MIME type.
- ✅ **Reports & Analytics**: Tested all 8 reports and CSV export streams.

---

## 📡 API Reference Overview

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Customer self-registration
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET /api/auth/me` — Current user profile and linked details
- `POST /api/auth/forgot-password` — Generate expiring reset token
- `POST /api/auth/reset-password` — Reset password using token
- `PUT /api/auth/profile` — Update account profile
- `PUT /api/auth/change-password` — Change password

### Products & Variants (`/api/products`)
- `GET /api/products` — List products with variants and calculated pricing
- `GET /api/products/:id` — Single product details
- `POST /api/products` — Create product (*Admin/Staff*)
- `PUT /api/products/:id` — Update product (*Admin/Staff*)
- `DELETE /api/products/:id` — Safe deletion / deactivation (*Admin*)
- `POST /api/products/:productId/variants` — Add brand variant (*Admin/Staff*)

### Subscription Plans (`/api/plans`)
- `GET /api/plans` — List plans with frequency & rules
- `POST /api/plans` — Create plan (*Admin/Staff*)
- `PUT /api/plans/:id` — Update plan (*Admin/Staff*)
- `DELETE /api/plans/:id` — Archive plan (*Admin*)

### Quotations (`/api/quotations`)
- `GET /api/quotations` — List quotations
- `GET /api/quotations/:id` — Single quotation with line items
- `POST /api/quotations` — Create commercial proposal (*Admin/Staff*)
- `POST /api/quotations/:id/convert` — 1-Click convert into subscription (*Admin/Staff*)
- `POST /api/quotations/:id/respond` — Accept or decline proposal (*Customer*)

### Subscriptions (`/api/subscriptions`)
- `GET /api/subscriptions` — List subscriptions
- `GET /api/subscriptions/:id` — Subscription details & billing timeline
- `POST /api/subscriptions` — Create subscription (*Admin/Staff*)
- `POST /api/subscriptions/:id/transition` — Action: `confirm`, `activate`, `pause`, `resume`, `renew`, `close`

### Invoices & Billing (`/api/invoices`)
- `GET /api/invoices` — List invoices
- `GET /api/invoices/:id` — Invoice details & payment history
- `GET /api/invoices/:id/pdf` — Stream official PDF Tax Invoice
- `POST /api/invoices` — Create manual invoice (*Admin/Staff*)
- `POST /api/invoices/trigger-recurring` — Run recurring billing engine (*Admin/Staff*)
- `POST /api/invoices/:id/cancel` — Cancel unpaid invoice (*Admin/Staff*)
- `POST /api/invoices/:id/send-email` — Dispatch invoice email notification

### Payments (`/api/payments`)
- `GET /api/payments` — Payment history
- `POST /api/payments` — Record payment with method, UTR, and balance update (*Admin/Staff*)

### Taxes & Discounts (`/api/taxes`, `/api/discounts`)
- `GET /api/taxes`, `POST /api/taxes` — Tax rules (*Admin*)
- `GET /api/discounts`, `POST /api/discounts` — Discount rules (*Admin*)
- `POST /api/discounts/validate` — Validate coupon eligibility and calculate savings

### Reports & Analytics (`/api/reports`)
- `GET /api/reports/:type` — Fetch report data (`total-revenue`, `monthly-revenue`, `active-subscriptions`, `closed-subscriptions`, `outstanding-invoices`, `overdue-invoices`, `payment-history`, `customer-subscriptions`)
- `GET /api/reports/:type/csv` — Stream report export as CSV attachment

---

## 💡 Known Considerations & Notes

- **Payment Tracking vs Live Gateway**: Designed specifically for enterprise B2B manual recording, verification, and remittance tracking (UTR, NEFT, UPI reference) as required in the project specifications.
- **Port Flexibility**: The backend uses environment variable `DB_PORT` (configured to port 3307 for the local MySQL 8.0 instance created for this workspace, but compatible with standard port 3306 by changing `.env`).
- **Financial Record Retention**: Hard deletion of historical financial transactions is strictly prevented; entities with transaction history are automatically deactivated rather than purged to preserve audit compliance.

---

© 2026 Brightloop Software Private Limited. All rights reserved.
