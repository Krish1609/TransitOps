const bcrypt = require('bcryptjs');
const pool = require('./pool');

async function seed() {
  try {
    console.log('Seeding TransitOps Database...');

    // Clear tables in reverse dependency order
    await pool.query('DELETE FROM trips');
    await pool.query('DELETE FROM vehicles');
    await pool.query('DELETE FROM drivers');
    await pool.query('DELETE FROM users');

    // 1. Seed Users
    const passwordHash = await bcrypt.hash('TransitOps2026!', 10);
    const mockUsers = [
      { name: 'Alice Smith', email: 'manager@transitops.com', role: 'Fleet Manager' },
      { name: 'Bob Jones', email: 'dispatcher@transitops.com', role: 'Dispatcher' },
      { name: 'Charlie Prince', email: 'safety@transitops.com', role: 'Safety Officer' },
      { name: 'Diana King', email: 'finance@transitops.com', role: 'Financial Analyst' },
    ];
    for (const u of mockUsers) {
      await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [u.name, u.email, passwordHash, u.role]
      );
      console.log(`- User: ${u.name} [${u.role}]`);
    }

    // 2. Seed Vehicles
    const mockVehicles = [
      { reg_no: 'TX-1002', name_model: 'Volvo FH16', type: 'Semi Truck', max_capacity_kg: 25000.00, odometer: 145000.50, acquisition_cost: 120000.00, status: 'On Trip' },
      { reg_no: 'TX-4401', name_model: 'Ford F-550', type: 'Box Truck', max_capacity_kg: 8500.00, odometer: 48900.20, acquisition_cost: 75000.00, status: 'Available' },
      { reg_no: 'TX-6009', name_model: 'Mercedes Sprinter', type: 'Van', max_capacity_kg: 3500.00, odometer: 82100.10, acquisition_cost: 45000.00, status: 'Available' },
      { reg_no: 'TX-8802', name_model: 'Scania R500', type: 'Semi Truck', max_capacity_kg: 26000.00, odometer: 210400.80, acquisition_cost: 135000.00, status: 'In Shop' },
      { reg_no: 'TX-1205', name_model: 'Isuzu NPR', type: 'Box Truck', max_capacity_kg: 6500.00, odometer: 320000.00, acquisition_cost: 55000.00, status: 'Retired' },
    ];
    const vehicleIds = {};
    for (const v of mockVehicles) {
      const [res] = await pool.query(
        'INSERT INTO vehicles (reg_no, name_model, type, max_capacity_kg, odometer, acquisition_cost, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [v.reg_no, v.name_model, v.type, v.max_capacity_kg, v.odometer, v.acquisition_cost, v.status]
      );
      vehicleIds[v.reg_no] = res.insertId;
      console.log(`- Vehicle: ${v.name_model} (${v.reg_no})`);
    }

    // 3. Seed Drivers
    const mockDrivers = [
      { name: 'Marcus Vance', license_no: 'DL-99201', license_category: 'Class A', license_expiry: '2028-10-15', contact_no: '+1-555-0101', safety_score: 95.50, status: 'On Trip' },
      { name: 'Sarah Connor', license_no: 'DL-77293', license_category: 'Class A', license_expiry: '2027-05-20', contact_no: '+1-555-0102', safety_score: 98.00, status: 'Available' },
      { name: 'James Rodriguez', license_no: 'DL-11029', license_category: 'Class B', license_expiry: '2029-02-11', contact_no: '+1-555-0103', safety_score: 89.20, status: 'Available' },
      { name: 'Elena Rostova', license_no: 'DL-88273', license_category: 'Class A', license_expiry: '2026-12-01', contact_no: '+1-555-0104', safety_score: 76.50, status: 'Suspended' },
      { name: 'David Kim', license_no: 'DL-44829', license_category: 'Class B', license_expiry: '2028-08-30', contact_no: '+1-555-0105', safety_score: 92.00, status: 'Off Duty' },
    ];
    const driverIds = {};
    for (const d of mockDrivers) {
      const [res] = await pool.query(
        'INSERT INTO drivers (name, license_no, license_category, license_expiry, contact_no, safety_score, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [d.name, d.license_no, d.license_category, d.license_expiry, d.contact_no, d.safety_score, d.status]
      );
      driverIds[d.name] = res.insertId;
      console.log(`- Driver: ${d.name}`);
    }

    // 4. Seed Trips
    const mockTrips = [
      {
        trip_code: 'TRIP-2026-101',
        source: 'Terminal A (Los Angeles)',
        destination: 'Distribution Hub (Denver)',
        vehicle_reg: 'TX-1002', // Volvo FH16 (On Trip)
        driver_name: 'Marcus Vance', // Marcus Vance (On Trip)
        cargo_weight_kg: 18500.00,
        planned_distance_km: 1650.00,
        final_odometer: null,
        fuel_consumed_l: null,
        status: 'Dispatched'
      },
      {
        trip_code: 'TRIP-2026-102',
        source: 'Warehouse 4 (Dallas)',
        destination: 'Retail Center (Austin)',
        vehicle_reg: 'TX-4401', // Ford F-550 (Available)
        driver_name: 'Sarah Connor', // Sarah Connor (Available)
        cargo_weight_kg: 5200.00,
        planned_distance_km: 320.00,
        final_odometer: 49220.20,
        fuel_consumed_l: 95.00,
        status: 'Completed'
      },
      {
        trip_code: 'TRIP-2026-103',
        source: 'Cargo Terminal (Seattle)',
        destination: 'Shipping Yard (Portland)',
        vehicle_reg: 'TX-6009', // Mercedes Sprinter (Available)
        driver_name: 'James Rodriguez', // James Rodriguez (Available)
        cargo_weight_kg: 3350.00,
        planned_distance_km: 280.00,
        final_odometer: null,
        fuel_consumed_l: null,
        status: 'Draft'
      },
      {
        trip_code: 'TRIP-2026-104',
        source: 'Industrial Zone (Chicago)',
        destination: 'Sorting Center (Detroit)',
        vehicle_reg: 'TX-8802', // Scania R500 (In Shop)
        driver_name: 'Elena Rostova', // Elena (Suspended)
        cargo_weight_kg: 12400.00,
        planned_distance_km: 450.00,
        final_odometer: null,
        fuel_consumed_l: null,
        status: 'Cancelled'
      }
    ];

    for (const t of mockTrips) {
      const vId = vehicleIds[t.vehicle_reg];
      const dId = driverIds[t.driver_name];
      if (!vId || !dId) {
        console.error(`Skipping trip ${t.trip_code} - Vehicle or Driver ID not resolved`);
        continue;
      }
      await pool.query(
        'INSERT INTO trips (trip_code, source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, final_odometer, fuel_consumed_l, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [t.trip_code, t.source, t.destination, vId, dId, t.cargo_weight_kg, t.planned_distance_km, t.final_odometer, t.fuel_consumed_l, t.status]
      );
      console.log(`- Trip: ${t.trip_code} from ${t.source} to ${t.destination}`);
    }

    console.log('TransitOps database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Database seeding failed:', err);
    process.exit(1);
  }
}

seed();
