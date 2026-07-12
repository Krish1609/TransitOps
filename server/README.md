# TransitOps Backend Server

This is the Express-based REST API backend for the TransitOps fleet management platform. It facilitates all operations including authentication, driver registries, vehicle tracking, maintenance logging, trip dispatching, fuel costs, analytics queries, and license reminders.

---

## ⚙️ Environment Variables (`.env`)

Verify that the `.env` settings are configured in the `server` root directory:

```properties
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=transitops
JWT_SECRET=your_jwt_secret_token

# Encryption Keys (AES-256)
ENCRYPTION_KEY=6b3e02f1a603c40375992a0bd8e08d6d9e0bd8fc6f2e960352ef1fd356ccae71

# SMTP Credentials
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=krishvaghasiya16@gmail.com
SMTP_PASS=vjuxuxxdgthpkati
```

---

## 🚀 Quick Start

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Database Migration**:
   Confirm MySQL database `transitops` exists and seed files are executed:
   ```bash
   mysql -u root -p transitops < db/schema.sql
   ```

3. **Start Server**:
   ```bash
   npm run dev
   ```
   *The api will start listening on `http://localhost:5000`.*

---

## 📡 API Endpoints

### 🔐 Authentication (`routes/auth.js`)
* `POST /api/auth/register` — Register a console operator.
* `POST /api/auth/login` — Sign in to the console.
* `POST /api/auth/forgot-password` — Send security verification code via Gmail.
* `POST /api/auth/reset-password` — Reprogram user password.
* `PUT /api/auth/profile` — Update username or change current console password (authenticated).

### 🚛 Vehicles (`routes/vehicles.js`)
* `GET /api/vehicles` — Query list of vehicles.
* `POST /api/vehicles` — Register a vehicle.
* `PUT /api/vehicles/:id` — Update vehicle attributes.
* `DELETE /api/vehicles/:id` — Retire or discard a vehicle.
* `GET /api/vehicles/:id/operational-cost` — Sum fuel + maintenance costs.

### 🧑‍✈️ Drivers (`routes/drivers.js`)
* `GET /api/drivers` — Query list of drivers (automatically decrypts PII attributes).
* `POST /api/drivers` — Register driver (automatically encrypts PII fields: `license_no`, `contact_no`).
* `PUT /api/drivers/:id` — Update driver details.
* `DELETE /api/drivers/:id` — Delete a driver.

### 📋 Trips (`routes/trips.js`)
* `GET /api/trips` — Query matching trips.
* `POST /api/trips` — Create draft trip.
* `POST /api/trips/:id/dispatch` — Dispatch trip checks. Checks vehicle capability, compliance expiry, and availability.
* `PUT /api/trips/:id/complete` — Conclude trip, record fuel usage, and restore vehicle status.
* `PUT /api/trips/:id/cancel` — Cancel trip.

### 🔧 Maintenance (`routes/maintenance.js`)
* `POST /api/maintenance` — Logs vehicle maintenance and flags state as `'In Shop'`.
* `PUT /api/maintenance/:id/complete` — Restores vehicle status to `'Available'` once maintenance is complete.

### ⛽ Expenses (`routes/fuel.js`, `routes/expenses.js`)
* `POST /api/fuel-logs` — Track liters and fuel costs.
* `POST /api/expenses` — Track tolls and miscellaneous transport costs.

### 📊 Analytics (`routes/analytics.js`)
* `GET /api/analytics` — Fleet performance KPIs (utilization, total operational costs, average fleet ROI).

### 🛡️ Administrative Override (`routes/admin.js`)
* `POST /api/admin/check-licenses` — Trigger daily safety audits manually.
