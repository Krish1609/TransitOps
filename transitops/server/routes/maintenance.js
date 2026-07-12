const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

// GET /api/maintenance - Fetch all logs joined with reg_no
router.get('/', requireAuth, async (req, res) => {
  try {
    const query = `
      SELECT m.*, v.reg_no, v.name_model
      FROM maintenance_logs m
      JOIN vehicles v ON m.vehicle_id = v.id
      ORDER BY m.id DESC
    `;
    const [rows] = await pool.query(query);

    // Format dates as YYYY-MM-DD
    const result = rows.map(log => {
      let dateStr = '';
      if (log.service_date) {
        const d = new Date(log.service_date);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        dateStr = `${yyyy}-${mm}-${dd}`;
      }
      return { ...log, service_date: dateStr };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/maintenance - Create active maintenance record & set vehicle to In Shop
router.post('/', requireAuth, async (req, res) => {
  const { vehicle_id, service_type, cost, service_date } = req.body;

  if (!vehicle_id || !service_type || cost === undefined || !service_date) {
    return res.status(400).json({ error: 'All fields (vehicle_id, service_type, cost, service_date) are required.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Verify vehicle exists and is eligible
    const [vehicles] = await conn.query('SELECT status FROM vehicles WHERE id = ?', [vehicle_id]);
    if (vehicles.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }
    const vehicle = vehicles[0];

    if (vehicle.status === 'Retired') {
      return res.status(400).json({ error: 'Cannot issue service orders for Retired fleet assets.' });
    }

    if (vehicle.status === 'On Trip') {
      return res.status(400).json({ error: 'Cannot send vehicle to maintenance while on an active log dispatch trip.' });
    }

    // Insert maintenance log
    const query = `
      INSERT INTO maintenance_logs (vehicle_id, service_type, cost, service_date, status)
      VALUES (?, ?, ?, ?, 'Active')
    `;
    const [result] = await conn.query(query, [vehicle_id, service_type.trim(), parseFloat(cost), service_date]);

    // Update vehicle status to 'In Shop'
    await conn.query('UPDATE vehicles SET status = "In Shop" WHERE id = ?', [vehicle_id]);

    await conn.commit();

    const [inserted] = await conn.query('SELECT * FROM maintenance_logs WHERE id = ?', [result.insertId]);
    res.status(201).json(inserted[0]);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    conn.release();
  }
});

// PUT /api/maintenance/:id/complete - Complete maintenance record & set vehicle to Available (unless Retired)
router.put('/:id/complete', requireAuth, async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Fetch maintenance log
    const [logs] = await conn.query('SELECT * FROM maintenance_logs WHERE id = ?', [id]);
    if (logs.length === 0) {
      return res.status(404).json({ error: 'Maintenance card not found.' });
    }
    const log = logs[0];

    if (log.status !== 'Active') {
      return res.status(400).json({ error: 'Maintenance card is already completed.' });
    }

    // Fetch vehicle
    const [vehicles] = await conn.query('SELECT status FROM vehicles WHERE id = ?', [log.vehicle_id]);
    const vehicle = vehicles[0];

    // Complete maintenance status
    await conn.query('UPDATE maintenance_logs SET status = "Completed" WHERE id = ?', [id]);

    // Resets vehicle status to 'Available' unless currently 'Retired'
    if (vehicle && vehicle.status !== 'Retired') {
      await conn.query('UPDATE vehicles SET status = "Available" WHERE id = ?', [log.vehicle_id]);
    }

    await conn.commit();
    res.json({ message: 'Service record logged as Completed.' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    conn.release();
  }
});

module.exports = router;
