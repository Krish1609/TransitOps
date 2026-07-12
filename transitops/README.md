<<<<<<< HEAD
# TransitOps Frontend Console

This is the React-based frontend dashboard client for the TransitOps fleet management platform. It renders live telemetry graphs, interactive dispatch sheets, PII security registers, and settings consoles.

---

## 🚀 Quick Start

1. **Install Packages**:
   ```bash
   npm install
   ```

2. **Configure Port Binding (Optional)**:
   By default, the client launches on port `3000`. If a port conflict arises (e.g. port `3000` is occupied), configure a secondary port setting:
   ```bash
   # Bash
   PORT=3050 BROWSER=none npm start

   # Windows PowerShell
   $env:PORT=3050; $env:BROWSER="none"; npm start
   ```

3. **Start Development Server**:
   ```bash
   npm start
   ```
   *The client console will launch at `http://localhost:3050`.*

---

## 📁 Component Directory map

* **`src/pages/Login.jsx`** — Sign-in console containing Forgot Password OTP prompts and password reprogrammers.
* **`src/pages/Dashboard.jsx`** — High-level telemetry dashboards detailing fleet utilization percentiles and recent dispatch ticks.
* **`src/pages/VehicleRegistry.jsx`** — Ledger grid for registering, tracking, or retiring trucks and vans.
* **`src/pages/Drivers.jsx`** — Safety ledger listing commercial CDL details, contact numbers, and safety audit override triggers.
* **`src/pages/TripDispatcher.jsx`** — Dispatch console for creating draft trips and executing safety checks before dispatching assets.
* **`src/pages/Maintenance.jsx`** — Maintenance logs monitoring available versus workshop states.
* **`src/pages/FuelExpenses.jsx`** — Expense monitoring logs.
* **`src/pages/Analytics.jsx`** — Recharts-based KPI cards and monthly operational cost summaries with CSV spreadsheet exporters.
* **`src/pages/Settings.jsx`** — Global depot configurations and role-based permissions matrix.
* **`src/pages/Profile.jsx`** — Operator profile details card and secure password updating engine.

---

## 🎨 Theme & Styling

TransitOps is built using **Vanilla CSS** and customized Tailwind style classes. It implements:
* Sleek dark-slate backgrounds (`bg-slate-950` / `bg-slate-900`) and borders (`border-slate-800`).
* Dynamic, interactive hover transitions for form elements and sidebar items.
* Responsive viewport support for desktop workstations and tablet displays (768px/1024px breakpoints).
=======
# TransitOps Platform

TransitOps is a modern, responsive fleet command platform that manages vehicle registries, driver safety profiles, dispatch sequences, shop maintenance workflows, and operating costs.

## Technical Stack & Configuration
* **Frontend**: React (Vite / custom setups) using Tailwind CSS and Recharts.
* **Backend**: Node.js & Express.js server connected to MySQL.
* **Authentication**: Token-based JWT authorization handlers.

---

## Analytics Operations & ROI Assumptions

Since the business specifications do not explicitly define a monetary revenue model for shipping runs, the **Reports & Analytics (Screen 7)** engine computes estimations based on the following rules:

1. **Estimated Revenue**:
   $$\text{Revenue} = \text{SUM}(\text{planned\_distance\_km at Completed Trips}) \times \$2.50\text{ USD}$$
   A standard rate of **$2.50 USD per kilometer** is applied across all completed logistics operations.

2. **Fleet / Vehicle ROI**:
   $$\text{ROI (\%)} = \frac{\text{Estimated Revenue} - (\text{Fuel Costs} + \text{Maintenance Costs})}{\text{Acquisition Cost}} \times 100$$
   Here, fuel logs and maintenance costs are compiled per vehicle (or fleet-wide) and compared against the capital asset acquisition value.

3. **Fuel Efficiency**:
   $$\text{Fuel Efficiency} = \frac{\text{SUM}(\text{planned\_distance\_km at Completed Trips})}{\text{SUM}(\text{fuel\_consumed\_l})}$$
>>>>>>> afda823669c70484156440e5d2a0e21dd5eef6a5
