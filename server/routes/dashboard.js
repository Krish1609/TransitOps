const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

// GET DASHBOARD KEY PERFORMANCE INDICATORS
router.get('/kpis', requireAuth, async (req, res) => {
  try {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM vehicles WHERE status != 'Retired') AS active_vehicles,
        (SELECT COUNT(*) FROM vehicles WHERE status = 'Available') AS available_vehicles,
        (SELECT COUNT(*) FROM vehicles WHERE status = 'In Shop') AS vehicles_in_maintenance,
        (SELECT COUNT(*) FROM vehicles WHERE status = 'On Trip') AS vehicles_on_trip,
        (SELECT COUNT(*) FROM trips WHERE status = 'Dispatched') AS active_trips,
        (SELECT COUNT(*) FROM trips WHERE status = 'Draft') AS pending_trips,
        (SELECT COUNT(*) FROM drivers WHERE status = 'On Trip') AS drivers_on_duty;
    `;
    const [rows] = await pool.query(query);
    const result = rows[0];

    const activeVehicles = Number(result.active_vehicles || 0);
    const vehiclesOnTrip = Number(result.vehicles_on_trip || 0);
    
    // Utilization logic
    const fleetUtilization = activeVehicles > 0 
      ? Math.round((vehiclesOnTrip / activeVehicles) * 100) 
      : 0;

    res.json({
      active_vehicles: activeVehicles,
      available_vehicles: Number(result.available_vehicles || 0),
      vehicles_in_maintenance: Number(result.vehicles_in_maintenance || 0),
      vehicles_on_trip: vehiclesOnTrip,
      active_trips: Number(result.active_trips || 0),
      pending_trips: Number(result.pending_trips || 0),
      drivers_on_duty: Number(result.drivers_on_duty || 0),
      fleet_utilization: fleetUtilization
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
