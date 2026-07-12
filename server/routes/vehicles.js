const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

// GET VEHICLES STATUS DISTRIBUTION SUMMARY
router.get('/status-summary', requireAuth, async (req, res) => {
  try {
    const query = `
      SELECT status, COUNT(*) AS count
      FROM vehicles
      GROUP BY status;
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
