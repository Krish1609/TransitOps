const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

// REGISTER USER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required (name, email, password, role)' });
    }

    // Check if user already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check role validity
    const validRoles = ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, role]
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// LOGIN USER
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Check safety lock-out: if locked_until is set and is in the future
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingMs = new Date(user.locked_until) - new Date();
      const remainingMin = Math.ceil(remainingMs / 60000);
      return res.status(403).json({
        error: `Account is temporarily locked. Please try again in ${remainingMin} minute(s).`
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    const isRoleValid = user.role === role;

    if (!isPasswordValid || !isRoleValid) {
      // Increment failed attempts
      const newFailedAttempts = user.failed_attempts + 1;
      let lockedUntil = null;
      let errorMsg = 'Invalid email, password, or role';

      if (newFailedAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        errorMsg = 'Account locked due to 5 consecutive failed attempts. Try again in 15 minutes.';
      }

      await pool.query(
        'UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?',
        [newFailedAttempts, lockedUntil, user.id]
      );

      return res.status(401).json({ error: errorMsg });
    }

    // Success: Reset safety locks and failed attempts
    await pool.query(
      'UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?',
      [user.id]
    );

    // Issue JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
