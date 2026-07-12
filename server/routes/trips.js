const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

// GET RECENT TRIPS (LIMIT 5) - Keep for compatibility
router.get('/recent', requireAuth, async (req, res) => {
  try {
    const query = `
      SELECT t.*, v.reg_no, v.name_model, d.name AS driver_name
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
      ORDER BY t.created_at DESC
      LIMIT 5;
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/trips - All trips for Live Board
router.get('/', requireAuth, async (req, res) => {
  try {
    const query = `
      SELECT t.*, 
             v.reg_no, v.name_model, v.max_capacity_kg, v.odometer AS vehicle_odometer,
             d.name AS driver_name, d.safety_score AS driver_safety_score, d.license_expiry, d.status AS driver_status
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
      ORDER BY t.id DESC
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/trips - Create Draft trip
router.post('/', requireAuth, async (req, res) => {
  try {
    const { source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km } = req.body;

    if (!source || !destination || !vehicle_id || !driver_id || cargo_weight_kg === undefined || planned_distance_km === undefined) {
      return res.status(400).json({ error: 'All fields (source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km) are required.' });
    }

    // Auto-generate trip code (e.g. TRIP-2026-XXXX)
    const uniqueRand = Math.floor(1000 + Math.random() * 9000);
    const tripCode = `TRIP-2026-${uniqueRand}`;

    const query = `
      INSERT INTO trips (trip_code, source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Draft')
    `;
    const params = [tripCode, source.trim(), destination.trim(), vehicle_id, driver_id, cargo_weight_kg, planned_distance_km];
    const [result] = await pool.query(query, params);

    const [inserted] = await pool.query('SELECT * FROM trips WHERE id = ?', [result.insertId]);
    res.status(201).json(inserted[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/trips/:id/dispatch - Dispatch a trip (Transaction)
router.post('/:id/dispatch', requireAuth, async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Fetch trip, vehicle, and driver details
    const [trips] = await conn.query('SELECT * FROM trips WHERE id = ?', [id]);
    if (trips.length === 0) {
      return res.status(404).json({ error: 'Trip not found.' });
    }
    const trip = trips[0];

    if (trip.status !== 'Draft') {
      return res.status(400).json({ error: 'Only Draft trips can be active dispatched.' });
    }

    const [vehicles] = await conn.query('SELECT * FROM vehicles WHERE id = ?', [trip.vehicle_id]);
    if (vehicles.length === 0) {
      return res.status(404).json({ error: 'Assigned vehicle not found.' });
    }
    const vehicle = vehicles[0];

    const [drivers] = await conn.query('SELECT * FROM drivers WHERE id = ?', [trip.driver_id]);
    if (drivers.length === 0) {
      return res.status(404).json({ error: 'Assigned driver not found.' });
    }
    const driver = drivers[0];

    // Check 1: cargo_weight <= vehicle.max_capacity_kg
    if (Number(trip.cargo_weight_kg) > Number(vehicle.max_capacity_kg)) {
      return res.status(400).json({ error: `Capacity exceeded: Cargo weight (${trip.cargo_weight_kg} kg) exceeds vehicle capacity limit (${vehicle.max_capacity_kg} kg).` });
    }

    // Check 2: vehicle.status === 'Available'
    if (vehicle.status !== 'Available') {
      return res.status(400).json({ error: `Vehicle is currently not available (status: ${vehicle.status}).` });
    }

    // Check 3: driver.status === 'Available'
    if (driver.status !== 'Available') {
      return res.status(400).json({ error: `Driver is currently not available (status: ${driver.status}).` });
    }

    // Check 4: driver.license_expiry >= today (CDL validation)
    const todayStr = new Date().toISOString().split('T')[0];
    let expiryStr = '';
    if (driver.license_expiry) {
      const expDate = new Date(driver.license_expiry);
      const yyyy = expDate.getFullYear();
      const mm = String(expDate.getMonth() + 1).padStart(2, '0');
      const dd = String(expDate.getDate()).padStart(2, '0');
      expiryStr = `${yyyy}-${mm}-${dd}`;
    }
    if (expiryStr < todayStr) {
      return res.status(400).json({ error: `Driver license is expired (expiry: ${expiryStr}).` });
    }

    // Check 5: driver.status !== 'Suspended'
    if (driver.status === 'Suspended') {
      return res.status(400).json({ error: 'Assigned driver is Suspended due to safety restrictions.' });
    }

    // Update statuses
    await conn.query('UPDATE trips SET status = "Dispatched" WHERE id = ?', [id]);
    await conn.query('UPDATE vehicles SET status = "On Trip" WHERE id = ?', [trip.vehicle_id]);
    await conn.query('UPDATE drivers SET status = "On Trip" WHERE id = ?', [trip.driver_id]);

    await conn.commit();
    res.json({ message: 'Trip dispatched successfully!' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    conn.release();
  }
});

// POST /api/trips/:id/complete - Complete trip (Transaction)
router.post('/:id/complete', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { final_odometer, fuel_consumed_l } = req.body;

  if (final_odometer === undefined || fuel_consumed_l === undefined) {
    return res.status(400).json({ error: 'Final odometer and fuel consumed are required.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [trips] = await conn.query('SELECT * FROM trips WHERE id = ?', [id]);
    if (trips.length === 0) {
      return res.status(404).json({ error: 'Trip not found.' });
    }
    const trip = trips[0];

    if (trip.status !== 'Dispatched') {
      return res.status(400).json({ error: 'Only Dispatched trips can be marked Completed.' });
    }

    const [vehicles] = await conn.query('SELECT * FROM vehicles WHERE id = ?', [trip.vehicle_id]);
    const vehicle = vehicles[0];

    if (parseFloat(final_odometer) < parseFloat(vehicle.odometer)) {
      return res.status(400).json({ error: `Final odometer cannot be less than initial value (${vehicle.odometer} km).` });
    }

    // Update trip details
    await conn.query(
      'UPDATE trips SET status = "Completed", final_odometer = ?, fuel_consumed_l = ? WHERE id = ?',
      [final_odometer, fuel_consumed_l, id]
    );

    // Update vehicle details
    await conn.query(
      'UPDATE vehicles SET status = "Available", odometer = ? WHERE id = ?',
      [final_odometer, trip.vehicle_id]
    );

    // Update driver details
    await conn.query(
      'UPDATE drivers SET status = "Available" WHERE id = ?',
      [trip.driver_id]
    );

    await conn.commit();
    res.json({ message: 'Trip completed successfully!' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    conn.release();
  }
});

// POST /api/trips/:id/cancel - Cancel trip (Transaction)
router.post('/:id/cancel', requireAuth, async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [trips] = await conn.query('SELECT * FROM trips WHERE id = ?', [id]);
    if (trips.length === 0) {
      return res.status(404).json({ error: 'Trip not found.' });
    }
    const trip = trips[0];

    if (trip.status !== 'Dispatched') {
      return res.status(400).json({ error: 'Only Dispatched trips can be Cancelled.' });
    }

    // Update trip
    await conn.query('UPDATE trips SET status = "Cancelled" WHERE id = ?', [id]);

    // Reset vehicle and driver statuses back to Available
    await conn.query('UPDATE vehicles SET status = "Available" WHERE id = ?', [trip.vehicle_id]);
    await conn.query('UPDATE drivers SET status = "Available" WHERE id = ?', [trip.driver_id]);

    await conn.commit();
    res.json({ message: 'Trip cancelled successfully.' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    conn.release();
  }
});

module.exports = router;
