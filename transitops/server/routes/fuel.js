const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

// GET /api/fuel-logs
router.get('/', requireAuth, async (req, res) => {
  try {
    const query = `
      SELECT f.*, v.reg_no, t.trip_code
      FROM fuel_logs f
      JOIN vehicles v ON f.vehicle_id = v.id
      LEFT JOIN trips t ON f.trip_id = t.id
      ORDER BY f.id DESC
    `;
    const [rows] = await pool.query(query);

    const result = rows.map(log => {
      let dateStr = '';
      if (log.log_date) {
        const d = new Date(log.log_date);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        dateStr = `${yyyy}-${mm}-${dd}`;
      }
      return { ...log, log_date: dateStr };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/fuel-logs
router.post('/', requireAuth, async (req, res) => {
  try {
    const { vehicle_id, trip_id, liters, cost, log_date } = req.body;

    if (!vehicle_id || liters === undefined || cost === undefined || !log_date) {
      return res.status(400).json({ error: 'All fields (vehicle_id, liters, cost, log_date) are required.' });
    }

    const query = `
      INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, log_date)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      vehicle_id,
      trip_id ? parseInt(trip_id) : null,
      parseFloat(liters),
      parseFloat(cost),
      log_date
    ];

    const [result] = await pool.query(query, params);
    const [inserted] = await pool.query('SELECT * FROM fuel_logs WHERE id = ?', [result.insertId]);
    res.status(201).json(inserted[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
