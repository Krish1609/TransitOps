const bcrypt = require('bcryptjs');
const pool = require('./pool');

async function seed() {
  try {
    console.log('Seeding mock users...');

    // Clean existing users to avoid unique email duplicate errors
    await pool.query('DELETE FROM users');

    // Generate secure default hash
    const passwordHash = await bcrypt.hash('TransitOps2026!', 10);

    const mockUsers = [
      { name: 'Alice Smith', email: 'manager@transitops.com', role: 'Fleet Manager' },
      { name: 'Bob Jones', email: 'dispatcher@transitops.com', role: 'Dispatcher' },
      { name: 'Charlie Prince', email: 'safety@transitops.com', role: 'Safety Officer' },
      { name: 'Diana King', email: 'finance@transitops.com', role: 'Financial Analyst' },
    ];

    for (const user of mockUsers) {
      await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [user.name, user.email, passwordHash, user.role]
      );
      console.log(`Registered user: ${user.name} [${user.role}] (${user.email})`);
    }

    console.log('Seeding complete. Ready for authentication verification!');
    process.exit(0);
  } catch (err) {
    console.error('Database seeding failed:', err);
    process.exit(1);
  }
}

seed();
