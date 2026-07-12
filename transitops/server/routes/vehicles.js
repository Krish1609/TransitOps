const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

// GET VEHICLES STATUS DISTRIBUTION SUMMARY (for Dashboard)
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

// GET /api/vehicles (filters: type, status, search by reg_no/name_model)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { type, status, search } = req.query;
    let query = 'SELECT * FROM vehicles WHERE 1=1';
    const params = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (reg_no LIKE ? OR name_model LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }

    query += ' ORDER BY id DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/vehicles — validate reg_no uniqueness
router.post('/', requireAuth, async (req, res) => {
  try {
    const { reg_no, name_model, type, max_capacity_kg, odometer, acquisition_cost, status } = req.body;

    // Basic Validation
    if (!reg_no || !name_model || !type || max_capacity_kg === undefined || acquisition_cost === undefined) {
      return res.status(400).json({ error: 'All fields (reg_no, name_model, type, max_capacity_kg, acquisition_cost) are required.' });
    }

    const trimmedRegNo = reg_no.trim();

    // Pre-check for registration uniqueness
    const [existing] = await pool.query('SELECT id FROM vehicles WHERE reg_no = ?', [trimmedRegNo]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Registration number already exists.' });
    }

    const query = `
      INSERT INTO vehicles (reg_no, name_model, type, max_capacity_kg, odometer, acquisition_cost, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      trimmedRegNo,
      name_model.trim(),
      type.trim(),
      max_capacity_kg,
      odometer || 0,
      acquisition_cost,
      status || 'Available'
    ];

    const [result] = await pool.query(query, params);
    const [inserted] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [result.insertId]);
    res.status(201).json(inserted[0]);
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Registration number already exists.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/vehicles/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reg_no, name_model, type, max_capacity_kg, odometer, acquisition_cost, status } = req.body;

    // Basic Validation
    if (!reg_no || !name_model || !type || max_capacity_kg === undefined || acquisition_cost === undefined) {
      return res.status(400).json({ error: 'All fields (reg_no, name_model, type, max_capacity_kg, acquisition_cost) are required.' });
    }

    const trimmedRegNo = reg_no.trim();

    // Pre-check for uniqueness excluding current vehicle ID
    const [existing] = await pool.query('SELECT id FROM vehicles WHERE reg_no = ? AND id != ?', [trimmedRegNo, id]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Registration number already exists.' });
    }

    const query = `
      UPDATE vehicles
      SET reg_no = ?, name_model = ?, type = ?, max_capacity_kg = ?, odometer = ?, acquisition_cost = ?, status = ?
      WHERE id = ?
    `;
    const params = [
      trimmedRegNo,
      name_model.trim(),
      type.trim(),
      max_capacity_kg,
      odometer || 0,
      acquisition_cost,
      status || 'Available',
      id
    ];

    const [result] = await pool.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const [updated] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Registration number already exists.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/vehicles/:id (soft-delete via status = Retired)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'UPDATE vehicles SET status = "Retired" WHERE id = ?';
    const [result] = await pool.query(query, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }
    res.json({ message: 'Vehicle retired successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/vehicles/:id/operational-cost
router.get('/:id/operational-cost', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [vehicle] = await pool.query('SELECT reg_no FROM vehicles WHERE id = ?', [id]);
    if (vehicle.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    const [fuelRows] = await pool.query('SELECT COALESCE(SUM(cost), 0) AS total FROM fuel_logs WHERE vehicle_id = ?', [id]);
    const [maintenanceRows] = await pool.query('SELECT COALESCE(SUM(cost), 0) AS total FROM maintenance_logs WHERE vehicle_id = ?', [id]);
    const [expenseRows] = await pool.query('SELECT COALESCE(SUM(toll + misc), 0) AS total FROM expenses WHERE vehicle_id = ?', [id]);

    const fuelCost = parseFloat(fuelRows[0].total);
    const maintenanceCost = parseFloat(maintenanceRows[0].total);
    const expenseCost = parseFloat(expenseRows[0].total);

    const totalOperationalCost = fuelCost + maintenanceCost;

    res.json({
      vehicle_id: parseInt(id),
      reg_no: vehicle[0].reg_no,
      fuel_cost: fuelCost,
      maintenance_cost: maintenanceCost,
      other_expense_cost: expenseCost,
      total_operational_cost: totalOperationalCost
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

