import { Knex } from 'knex';
import bcrypt from 'bcryptjs';
import { hashOtpSha256 } from '../../utils/crypto';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing entries in correct order (reverse dependency)
  console.log('🧹 Clearing existing data...');
  
  // Disable foreign key checks temporarily
  await knex.raw('SET session_replication_role = replica;');
  
  // Delete in correct order (child tables first)
  await knex('reviews').del();
  await knex('disputes').del();
  await knex('location_breadcrumbs').del();
  await knex('escrow_ledger').del();
  await knex('shipments').del();
  await knex('bids').del();
  await knex('loads').del();
  await knex('vehicles').del();
  await knex('audit_logs').del();
  await knex('users').del();
  
  // Re-enable foreign key checks
  await knex.raw('SET session_replication_role = DEFAULT;');

  const defaultPassword = await bcrypt.hash('Password123!', 10);

  // Insert Users
  console.log('👤 Creating users...');
  const [shipper] = await knex('users')
    .insert({
      full_name: 'Abebe Bikila Freight Ltd',
      phone_number: '+251911123456',
      email: 'shipper@habeshafreight.et',
      password_hash: defaultPassword,
      role: 'SHIPPER',
      is_verified: true,
      status: 'ACTIVE',
      kyc_status: 'APPROVED',
    })
    .returning('*');

  const [driver] = await knex('users')
    .insert({
      full_name: 'Kebede Tadesse',
      phone_number: '+251922654321',
      email: 'driver@habeshafreight.et',
      password_hash: defaultPassword,
      role: 'DRIVER',
      is_verified: true,
      status: 'ACTIVE',
      kyc_status: 'APPROVED',
    })
    .returning('*');

  const [admin] = await knex('users')
    .insert({
      full_name: 'System Administrator',
      phone_number: '+251900000000',
      email: 'admin@habeshafreight.et',
      password_hash: defaultPassword,
      role: 'ADMIN',
      is_verified: true,
      status: 'ACTIVE',
      kyc_status: 'APPROVED',
    })
    .returning('*');

  const [fleetOwner] = await knex('users')
    .insert({
      full_name: 'Ethio Logistics PLC',
      phone_number: '+251911987654',
      email: 'fleet@habeshafreight.et',
      password_hash: defaultPassword,
      role: 'FLEET_OWNER',
      is_verified: true,
      status: 'ACTIVE',
      kyc_status: 'APPROVED',
    })
    .returning('*');

  // Insert Vehicles
  console.log('🚗 Creating vehicles...');
  const [vehicle1] = await knex('vehicles')
    .insert({
      driver_id: driver.id,
      plate_number: 'ET-3-45892',
      vehicle_type: 'SINO_TRUCK',
      capacity_tons: 25.0,
      is_active: true,
      verification_status: 'VERIFIED',
    })
    .returning('*');

  const [vehicle2] = await knex('vehicles')
    .insert({
      driver_id: driver.id,
      plate_number: 'ET-4-12345',
      vehicle_type: 'ISUZU_DRY',
      capacity_tons: 15.0,
      is_active: true,
      verification_status: 'VERIFIED',
    })
    .returning('*');

  // Insert Demo Loads
  console.log('📦 Creating loads...');
  
  // Load 1: Addis Ababa -> Hawassa
  const [load1] = await knex('loads')
    .insert({
      shipper_id: shipper.id,
      cargo_description: 'Construction Cement Bags (500 Bags)',
      weight_tons: 25.0,
      origin_city: 'Addis Ababa',
      destination_city: 'Hawassa',
      origin_lat: 8.9806,
      origin_lng: 38.7578,
      destination_lat: 7.0621,
      destination_lng: 38.4763,
      status: 'POSTED',
      offered_price_etb: 45000.0,
    })
    .returning('*');

  // Load 2: Addis Ababa -> Bahir Dar
  const [load2] = await knex('loads')
    .insert({
      shipper_id: shipper.id,
      cargo_description: 'Agricultural Machinery (3 Units)',
      weight_tons: 18.0,
      origin_city: 'Addis Ababa',
      destination_city: 'Bahir Dar',
      origin_lat: 8.9806,
      origin_lng: 38.7578,
      destination_lat: 11.5742,
      destination_lng: 37.3614,
      status: 'POSTED',
      offered_price_etb: 52000.0,
    })
    .returning('*');

  // Load 3: Addis Ababa -> Dire Dawa
  const [load3] = await knex('loads')
    .insert({
      shipper_id: shipper.id,
      cargo_description: 'Electronics and Appliances',
      weight_tons: 12.0,
      origin_city: 'Addis Ababa',
      destination_city: 'Dire Dawa',
      origin_lat: 8.9806,
      origin_lng: 38.7578,
      destination_lat: 9.6008,
      destination_lng: 41.8501,
      status: 'POSTED',
      offered_price_etb: 38000.0,
    })
    .returning('*');

  // Insert Bids for Load 1
  console.log('💰 Creating bids...');
  await knex('bids').insert({
    load_id: load1.id,
    driver_id: driver.id,
    bid_amount_etb: 44000.0,
    status: 'PENDING',
  });

  // Create a second driver for bids
  const [driver2] = await knex('users')
    .insert({
      full_name: 'Mekonnen Worku',
      phone_number: '+251911888777',
      email: 'driver2@habeshafreight.et',
      password_hash: defaultPassword,
      role: 'DRIVER',
      is_verified: true,
      status: 'ACTIVE',
      kyc_status: 'APPROVED',
    })
    .returning('*');

  const [vehicle3] = await knex('vehicles')
    .insert({
      driver_id: driver2.id,
      plate_number: 'ET-5-67890',
      vehicle_type: 'TRAILER',
      capacity_tons: 35.0,
      is_active: true,
      verification_status: 'VERIFIED',
    })
    .returning('*');

  await knex('bids').insert({
    load_id: load1.id,
    driver_id: driver2.id,
    bid_amount_etb: 43000.0,
    status: 'PENDING',
  });

  // Create a shipment for the first load
  console.log('🚚 Creating shipments...');
  await knex('shipments').insert({
    load_id: load1.id,
    carrier_id: driver.id,
    vehicle_id: vehicle1.id,
    status: 'ASSIGNED',
    pickup_otp_hash: hashOtpSha256('123456'),
    delivery_otp_hash: hashOtpSha256('654321'),
  });

  console.log('✅ Demo seed data successfully populated.');
  console.log('📊 Data Summary:');
  console.log(`  👤 Users: 5 (SHIPPER, DRIVER, ADMIN, FLEET_OWNER, DRIVER2)`);
  console.log(`  🚗 Vehicles: 3`);
  console.log(`  📦 Loads: 3`);
  console.log(`  💰 Bids: 2`);
  console.log(`  🚚 Shipments: 1`);
}
