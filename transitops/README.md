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
