# TransitOps Fleet Command Station

TransitOps is a responsive, web-based fleet management platform that coordinates vehicle registries, driver safety logs, trip dispatch sequences, maintenance schedules, and operating costs.

---

## 🚀 Getting Started

### 1. Database Schema Seeding
Create a MySQL database named `transitops` and run the script located at:
```bash
mysql -u root -p < server/db/schema.sql
```
*Note: The script establishes baseline tables for users, vehicles, drivers (including AES-256 PII fields), trips, maintenance, fuel logs, and toll expenses.*

### 2. Backend Config (`server/.env`)
Create a `server/.env` file with the parameters:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=transitops
JWT_SECRET=your_jwt_secret_token

# Encryption Keys (AES-256)
ENCRYPTION_KEY=6b3e02f1a603c40375992a0bd8e08d6d9e0bd8fc6f2e960352ef1fd356ccae71

# SMTP Credentials (for License Reminders)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=demo_carrier@ethereal.email
SMTP_PASS=demo_pass_123
```

To run the backend server:
```bash
cd server
npm install
npm start
```
The server will run on `http://localhost:5000`.

### 3. Frontend Config
To start the React frontend:
```bash
cd transitops
npm install
npm start
```
The app will run on `http://localhost:3000`.

---

## 🔒 Security & Data Encryption (Stage 12)

1. **Passwords**: Securely stored using one-way `bcrypt` hashes.
2. **PII Data at Rest**: Driver license numbers (`license_no`) and contact coordinates (`contact_no`) are encrypted using **AES-256** field-level encryption (via `CryptoJS.AES`) prior to database INSERT/UPDATE and decrypted upon retrieval.
3. **Transport Encryption**: Under deployment pipelines, all traffic runs behind SSL/TLS (HTTPS) routed through hosting providers or configured reverse proxies (Nginx/Caddy).

---

## 📊 Analytics & ROI Model Assumptions (Stage 10)

Trip revenue is simulated using a flat valuation standard since shipping fees are not explicitly tracked at dispatch:

1. **Revenue Approximation**:
   $$\text{Revenue} = \text{SUM}(\text{planned\_distance\_km on Completed Trips}) \times \$2.50\text{ USD}$$
2. **Fleet ROI Formulation**:
   $$\text{ROI (\%)} = \frac{\text{Est. Revenue} - (\text{Fuel Cost} + \text{Maintenance Fees})}{\text{Total Asset Acquisition Cost}} \times 100$$
3. **Fuel Efficiency Metric**:
   $$\text{Efficiency (km/L)} = \frac{\text{SUM}(\text{planned\_distance\_km on Completed Trips})}{\text{SUM}(\text{fuel\_consumed\_l})}$$

---

## 📋 Platform Navigation Map
* **`/dashboard`**: High-level KPIs, Fleet Utilization, and Recent Dispatch tickers.
* **`/vehicles`**: Add, edit, or retire vehicles; handles odometer telemetry and acquisition ledgers.
* **`/drivers`**: Safety logs, licensing categories, license expirations, and a manual Safety Officer license check SMTP trigger.
* **`/trips`**: Dispatch lifecycle dashboard (Draft $\rightarrow$ Dispatched $\rightarrow$ Completed/Cancelled).
* **`/maintenance`**: Log maintenance logs, auto-changing vehicle states (Available $\rightleftarrows$ In Shop).
* **`/fuel-expenses`**: Combined console tracking fuel audits, receipts, and per-vehicle operating summaries.
* **`/analytics`**: Recharts monthly bar charts, costly vehicle breakdowns, and CSV data exporter.
* **`/settings`**: Master depot controls and page role-permission grids (RBAC).
