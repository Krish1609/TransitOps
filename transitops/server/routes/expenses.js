const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

// GET /api/expenses
router.get('/', requireAuth, async (req, res) => {
  try {
    const query = `
      SELECT e.*, v.reg_no, t.trip_code
      FROM expenses e
      JOIN vehicles v ON e.vehicle_id = v.id
      LEFT JOIN trips t ON e.trip_id = t.id
      ORDER BY e.id DESC
    `;
    const [rows] = await pool.query(query);

    const result = rows.map(log => {
      let dateStr = '';
      if (log.expense_date) {
        const d = new Date(log.expense_date);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        dateStr = `${yyyy}-${mm}-${dd}`;
      }
      return { ...log, expense_date: dateStr };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/expenses
router.post('/', requireAuth, async (req, res) => {
  try {
    const { vehicle_id, trip_id, toll, misc, expense_date } = req.body;

    if (!vehicle_id || expense_date === undefined) {
      return res.status(400).json({ error: 'Vehicle ID and Expense Date are required.' });
    }

    const query = `
      INSERT INTO expenses (vehicle_id, trip_id, toll, misc, expense_date)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      vehicle_id,
      trip_id ? parseInt(trip_id) : null,
      toll === undefined ? 0 : parseFloat(toll),
      misc === undefined ? 0 : parseFloat(misc),
      expense_date
    ];

    const [result] = await pool.query(query, params);
    const [inserted] = await pool.query('SELECT * FROM expenses WHERE id = ?', [result.insertId]);
    res.status(201).json(inserted[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
