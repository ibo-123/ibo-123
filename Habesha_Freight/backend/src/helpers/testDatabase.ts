import knex from 'knex';

export function getTestDb() {
  const connectionString = process.env.TEST_DATABASE_URL || 
                          'postgresql://postgres:postgres@127.0.0.1:5432/habesha_freight_test';
  
  return knex({
    client: 'pg',
    connection: connectionString,
    pool: { min: 2, max: 10 },
    migrations: {
      directory: './src/database/migrations',
      extension: 'ts',
    },
  });
}

export async function setupTestDatabase() {
  const db = getTestDb();
  
  try {
    console.log('🔄 Setting up test database...');
    await db.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await db.raw('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    await db.migrate.latest();
    console.log('✅ Migrations completed successfully');
    await cleanTestDatabase(db);
    return db;
  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    throw error;
  }
}

export async function cleanTestDatabase(db: knex.Knex) {
  if (!db) {
    db = getTestDb();
  }
  
  const tables = await db.raw(`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public'
    AND tablename NOT IN ('knex_migrations', 'knex_migrations_lock')
  `);
  
  if (tables.rows.length === 0) {
    return;
  }
  
  await db.raw('SET session_replication_role = replica;');
  const tableNames = tables.rows.map((row: any) => row.tablename).join(', ');
  await db.raw(`TRUNCATE TABLE ${tableNames} CASCADE;`);
  await db.raw('SET session_replication_role = DEFAULT;');
}

export async function destroyTestDatabase(db: knex.Knex) {
  if (db) {
    await db.destroy();
  }
}

// Schema helper functions
export async function tableExists(db: knex.Knex, tableName: string): Promise<boolean> {
  const result = await db.raw(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = ?
    ) AS exists
  `, [tableName]);
  
  return result.rows[0].exists;
}

export async function getTableColumns(db: knex.Knex, tableName: string): Promise<string[]> {
  const result = await db.raw(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = ?
    ORDER BY ordinal_position
  `, [tableName]);
  
  return result.rows.map((row: any) => row.column_name);
}

// Constraint helper functions
export async function getUniqueConstraints(db: knex.Knex, tableName: string): Promise<any[]> {
  const result = await db.raw(`
    SELECT
      tc.constraint_name,
      kcu.column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'UNIQUE'
      AND tc.table_name = ?
      AND tc.table_schema = 'public'
  `, [tableName]);
  
  return result.rows;
}

export async function getForeignKeys(db: knex.Knex, tableName: string): Promise<any[]> {
  const result = await db.raw(`
    SELECT
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.update_rule,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = ?
      AND tc.table_schema = 'public'
  `, [tableName]);
  
  return result.rows;
}

// Create test user factory
export async function createTestUser(db: knex.Knex, overrides: any = {}) {
  const timestamp = Date.now();
  const user = {
    full_name: overrides.full_name || `Test User ${timestamp}`,
    phone_number: overrides.phone_number || `+251${Math.floor(Math.random() * 999999999)}`,
    email: overrides.email || `test${timestamp}@example.com`,
    password_hash: overrides.password_hash || '$2a$10$hashed_password',
    role: overrides.role || 'SHIPPER',
    is_verified: overrides.is_verified !== undefined ? overrides.is_verified : false,
    status: overrides.status || 'ACTIVE',
    kyc_status: overrides.kyc_status || 'PENDING',
    ...overrides
  };
  
  Object.keys(user).forEach(key => {
    if (user[key] === undefined) delete user[key];
  });
  
  const [result] = await db('users').insert(user).returning('*');
  return result;
}

// Create test vehicle factory
export async function createTestVehicle(db: knex.Knex, driverId: string, overrides: any = {}) {
  const vehicle = {
    driver_id: driverId,
    plate_number: overrides.plate_number || `ET-${Math.floor(Math.random() * 99999)}-${Date.now()}`,
    vehicle_type: overrides.vehicle_type || 'SINO_TRUCK',
    capacity_tons: overrides.capacity_tons || 25.0,
    is_active: overrides.is_active !== undefined ? overrides.is_active : true,
    verification_status: overrides.verification_status || 'PENDING',
    ...overrides
  };
  
  Object.keys(vehicle).forEach(key => {
    if (vehicle[key] === undefined) delete vehicle[key];
  });
  
  const [result] = await db('vehicles').insert(vehicle).returning('*');
  return result;
}

// Create test load factory
export async function createTestLoad(db: knex.Knex, shipperId: string, overrides: any = {}) {
  const load = {
    shipper_id: shipperId,
    cargo_description: overrides.cargo_description || `Test Cargo ${Date.now()}`,
    weight_tons: overrides.weight_tons || 10.0,
    origin_city: overrides.origin_city || 'Addis Ababa',
    destination_city: overrides.destination_city || 'Hawassa',
    origin_lat: overrides.origin_lat || 8.9806,
    origin_lng: overrides.origin_lng || 38.7578,
    destination_lat: overrides.destination_lat || 7.0621,
    destination_lng: overrides.destination_lng || 38.4763,
    status: overrides.status || 'POSTED',
    offered_price_etb: overrides.offered_price_etb || 45000.0,
    ...overrides
  };
  
  Object.keys(load).forEach(key => {
    if (load[key] === undefined) delete load[key];
  });
  
  const [result] = await db('loads').insert(load).returning('*');
  return result;
}

// Create test shipment factory
export async function createTestShipment(
  db: knex.Knex, 
  loadId: string, 
  carrierId: string, 
  vehicleId: string | null = null, 
  overrides: any = {}
) {
  const shipment = {
    load_id: loadId,
    carrier_id: carrierId,
    vehicle_id: vehicleId,
    status: overrides.status || 'ASSIGNED',
    pickup_otp_hash: overrides.pickup_otp_hash || 'hashed_pickup_otp',
    delivery_otp_hash: overrides.delivery_otp_hash || 'hashed_delivery_otp',
    ...overrides
  };
  
  Object.keys(shipment).forEach(key => {
    if (shipment[key] === undefined) delete shipment[key];
  });
  
  const [result] = await db('shipments').insert(shipment).returning('*');
  return result;
}

// Create test bid factory
export async function createTestBid(db: knex.Knex, loadId: string, driverId: string, overrides: any = {}) {
  const bid = {
    load_id: loadId,
    driver_id: driverId,
    bid_amount_etb: overrides.bid_amount_etb || 44000.0,
    status: overrides.status || 'PENDING',
    ...overrides
  };
  
  Object.keys(bid).forEach(key => {
    if (bid[key] === undefined) delete bid[key];
  });
  
  const [result] = await db('bids').insert(bid).returning('*');
  return result;
}

// Create test dispute factory
export async function createTestDispute(db: knex.Knex, shipmentId: string, raisedById: string, overrides: any = {}) {
  const dispute = {
    shipment_id: shipmentId,
    raised_by_id: raisedById,
    category: overrides.category || 'OTHER',
    reason: overrides.reason || 'Test dispute reason',
    status: overrides.status || 'OPEN',
    ...overrides
  };
  
  Object.keys(dispute).forEach(key => {
    if (dispute[key] === undefined) delete dispute[key];
  });
  
  const [result] = await db('disputes').insert(dispute).returning('*');
  return result;
}

// Create test review factory
export async function createTestReview(db: knex.Knex, shipmentId: string, reviewerId: string, revieweeId: string, overrides: any = {}) {
  const review = {
    shipment_id: shipmentId,
    reviewer_id: reviewerId,
    reviewee_id: revieweeId,
    rating: overrides.rating || 5,
    comment: overrides.comment || 'Great service!',
    ...overrides
  };
  
  Object.keys(review).forEach(key => {
    if (review[key] === undefined) delete review[key];
  });
  
  const [result] = await db('reviews').insert(review).returning('*');
  return result;
}

// Create test escrow factory
export async function createTestEscrow(db: knex.Knex, shipmentId: string, payerId: string, beneficiaryId: string, overrides: any = {}) {
  const gross = overrides.gross_amount_etb || 45000.0;
  const commission = overrides.commission_amount_etb || 4500.0;
  const net = overrides.net_payout_amount_etb || gross - commission;
  
  const escrow = {
    shipment_id: shipmentId,
    payer_id: payerId,
    beneficiary_id: beneficiaryId,
    gross_amount_etb: gross,
    commission_amount_etb: commission,
    net_payout_amount_etb: net,
    gateway_reference: overrides.gateway_reference || `ref_${Date.now()}`,
    idempotency_key: overrides.idempotency_key || `idemp_${Date.now()}`,
    status: overrides.status || 'PENDING',
    ...overrides
  };
  
  Object.keys(escrow).forEach(key => {
    if (escrow[key] === undefined) delete escrow[key];
  });
  
  const [result] = await db('escrow_ledger').insert(escrow).returning('*');
  return result;
}

// Create test location factory
export async function createTestLocation(db: knex.Knex, shipmentId: string, driverId: string, overrides: any = {}) {
  const location = {
    shipment_id: shipmentId,
    driver_id: driverId,
    latitude: overrides.latitude || 8.9806,
    longitude: overrides.longitude || 38.7578,
    speed: overrides.speed || 60.5,
    recorded_at: overrides.recorded_at || new Date(),
    ...overrides
  };
  
  Object.keys(location).forEach(key => {
    if (location[key] === undefined) delete location[key];
  });
  
  const [result] = await db('location_breadcrumbs').insert(location).returning('*');
  return result;
}
