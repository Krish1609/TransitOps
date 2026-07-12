const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

// GET /api/drivers (list all drivers with computed columns)
router.get('/', requireAuth, async (req, res) => {
  try {
    const query = `
      SELECT d.*,
             (SELECT COUNT(*) FROM trips WHERE driver_id = d.id AND status = 'Completed') AS completed,
             (SELECT COUNT(*) FROM trips WHERE driver_id = d.id) AS total
      FROM drivers d
      ORDER BY d.id DESC
    `;
    const [rows] = await pool.query(query);

    const todayStr = new Date().toISOString().split('T')[0];

    const result = rows.map(driver => {
      let expiryStr = '';
      if (driver.license_expiry) {
        // Handle timezone difference and format as YYYY-MM-DD
        const expDate = new Date(driver.license_expiry);
        const yyyy = expDate.getFullYear();
        const mm = String(expDate.getMonth() + 1).padStart(2, '0');
        const dd = String(expDate.getDate()).padStart(2, '0');
        expiryStr = `${yyyy}-${mm}-${dd}`;
      }
      
      const expired = expiryStr ? expiryStr < todayStr : false;
      
      const comp = Number(driver.completed || 0);
      const tot = Number(driver.total || 0);
      const trip_completion_pct = tot > 0 ? Math.round((comp / tot) * 100) : 100;

      return {
        ...driver,
        license_expiry: expiryStr,
        license_expired: expired,
        trip_completion_pct
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/drivers - Create a driver
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, license_no, license_category, license_expiry, contact_no, safety_score, status } = req.body;

    if (!name || !license_no || !license_expiry) {
      return res.status(400).json({ error: 'All fields (name, license_no, license_expiry) are required.' });
    }

    const trimmedLicenseNo = license_no.trim();

    // Pre-check for license key uniqueness
    const [existing] = await pool.query('SELECT id FROM drivers WHERE license_no = ?', [trimmedLicenseNo]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'License number already registered.' });
    }

    const query = `
      INSERT INTO drivers (name, license_no, license_category, license_expiry, contact_no, safety_score, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      name.trim(),
      trimmedLicenseNo,
      license_category || '',
      license_expiry,
      contact_no || '',
      safety_score === undefined || safety_score === '' ? 100.00 : parseFloat(safety_score),
      status || 'Available'
    ];

    const [result] = await pool.query(query, params);
    
    // Fetch inserted driver
    const [insertedRows] = await pool.query('SELECT * FROM drivers WHERE id = ?', [result.insertId]);
    res.status(201).json(insertedRows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'License number already registered.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/drivers/:id - Update driver
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, license_no, license_category, license_expiry, contact_no, safety_score, status } = req.body;

    if (!name || !license_no || !license_expiry) {
      return res.status(400).json({ error: 'All fields (name, license_no, license_expiry) are required.' });
    }

    const trimmedLicenseNo = license_no.trim();

    // Pre-check excluding current ID
    const [existing] = await pool.query('SELECT id FROM drivers WHERE license_no = ? AND id != ?', [trimmedLicenseNo, id]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'License number already registered.' });
    }

    const query = `
      UPDATE drivers
      SET name = ?, license_no = ?, license_category = ?, license_expiry = ?, contact_no = ?, safety_score = ?, status = ?
      WHERE id = ?
    `;
    const params = [
      name.trim(),
      trimmedLicenseNo,
      license_category || '',
      license_expiry,
      contact_no || '',
      safety_score === undefined || safety_score === '' ? 100.00 : parseFloat(safety_score),
      status || 'Available',
      id
    ];

    const [result] = await pool.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Driver not found.' });
    }

    const [updatedRows] = await pool.query('SELECT * FROM drivers WHERE id = ?', [id]);
    res.json(updatedRows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'License number already registered.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/drivers/:id - Delete driver (only if they aren't on an active trip)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if on trip
    const [driver] = await pool.query('SELECT status FROM drivers WHERE id = ?', [id]);
    if (driver.length === 0) {
      return res.status(404).json({ error: 'Driver not found.' });
    }

    if (driver[0].status === 'On Trip') {
      return res.status(400).json({ error: 'Cannot delete driver while on a dispatch trip.' });
    }

    await pool.query('DELETE FROM drivers WHERE id = ?', [id]);
    res.json({ message: 'Driver deleted successfully.' });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(400).json({ error: 'Cannot delete driver: historical active trip logs reference this driver.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
