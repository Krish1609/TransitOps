const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

// GET /api/analytics/summary - KPI Cards
router.get('/summary', requireAuth, async (req, res) => {
  try {
    // 1. Fuel Efficiency
    const [fuelRows] = await pool.query(`
      SELECT 
        COALESCE(SUM(planned_distance_km), 0) AS total_distance, 
        COALESCE(SUM(fuel_consumed_l), 0) AS total_fuel
      FROM trips 
      WHERE status = 'Completed'
    `);
    const totalDistance = parseFloat(fuelRows[0].total_distance || 0);
    const totalFuel = parseFloat(fuelRows[0].total_fuel || 0);
    const fuelEfficiency = totalFuel > 0 ? (totalDistance / totalFuel).toFixed(2) : '0.00';

    // 2. Fleet Utilization
    const [utilRows] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM vehicles WHERE status != 'Retired') AS active_vehicles,
        (SELECT COUNT(*) FROM vehicles WHERE status = 'On Trip') AS vehicles_on_trip
    `);
    const activeVehicles = parseInt(utilRows[0].active_vehicles || 0);
    const vehiclesOnTrip = parseInt(utilRows[0].vehicles_on_trip || 0);
    const fleetUtilization = activeVehicles > 0 ? Math.round((vehiclesOnTrip / activeVehicles) * 100) : 0;

    // 3. Operational Cost fleet-wide
    const [costRows] = await pool.query(`
      SELECT
        (SELECT COALESCE(SUM(cost), 0) FROM fuel_logs) AS total_fuel_cost,
        (SELECT COALESCE(SUM(cost), 0) FROM maintenance_logs) AS total_maintenance_cost
    `);
    const fuelCost = parseFloat(costRows[0].total_fuel_cost || 0);
    const maintenanceCost = parseFloat(costRows[0].total_maintenance_cost || 0);
    const totalOperationalCost = fuelCost + maintenanceCost;

    // 4. Vehicle ROI fleet-wide
    // Revenue estimate: Flat rate of $2.50 per km of completed trips
    const revenue = totalDistance * 2.50;
    const [acqRows] = await pool.query(`
      SELECT COALESCE(SUM(acquisition_cost), 0) AS total_acquisition_cost 
      FROM vehicles 
      WHERE status != 'Retired'
    `);
    const totalAcquisitionCost = parseFloat(acqRows[0].total_acquisition_cost || 0);
    const fleetROI = totalAcquisitionCost > 0 
      ? (((revenue - totalOperationalCost) / totalAcquisitionCost) * 100).toFixed(1)
      : '0.0';

    res.json({
      fuel_efficiency_km_l: parseFloat(fuelEfficiency),
      fleet_utilization_pct: fleetUtilization,
      total_operational_cost: totalOperationalCost,
      fleet_roi_pct: parseFloat(fleetROI),
      details: {
        total_distance_km: totalDistance,
        total_fuel_liters: totalFuel,
        total_revenue_usd: revenue,
        total_fuel_cost_usd: fuelCost,
        total_maintenance_cost_usd: maintenanceCost,
        total_acquisition_cost_usd: totalAcquisitionCost
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/monthly-revenue - Group by month for Charts
router.get('/monthly-revenue', requireAuth, async (req, res) => {
  try {
    const query = `
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        SUM(planned_distance_km * 2.50) AS revenue,
        SUM(planned_distance_km) AS distance
      FROM trips
      WHERE status = 'Completed'
      GROUP BY month
      ORDER BY month ASC;
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/top-costly-vehicles - Order by total cost desc
router.get('/top-costly-vehicles', requireAuth, async (req, res) => {
  try {
    const query = `
      SELECT
        v.id, v.reg_no, v.name_model,
        (SELECT COALESCE(SUM(cost), 0) FROM fuel_logs WHERE vehicle_id = v.id) AS fuel_cost,
        (SELECT COALESCE(SUM(cost), 0) FROM maintenance_logs WHERE vehicle_id = v.id) AS maintenance_cost,
        (SELECT COALESCE(SUM(toll + misc), 0) FROM expenses WHERE vehicle_id = v.id) AS expense_cost
      FROM vehicles v
      WHERE v.status != 'Retired'
      ORDER BY (fuel_cost + maintenance_cost + expense_cost) DESC
      LIMIT 5;
    `;
    const [rows] = await pool.query(query);

    const result = rows.map(r => {
      const f = parseFloat(r.fuel_cost);
      const m = parseFloat(r.maintenance_cost);
      const e = parseFloat(r.expense_cost);
      return {
        id: r.id,
        reg_no: r.reg_no,
        name_model: r.name_model,
        fuel_cost: f,
        maintenance_cost: m,
        other_expense_cost: e,
        total_cost: f + m + e
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
