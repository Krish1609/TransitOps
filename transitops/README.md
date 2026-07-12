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
