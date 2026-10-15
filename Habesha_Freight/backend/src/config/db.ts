import knex from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'habeshafreight',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    max: parseInt(process.env.DB_POOL_MAX || '10'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: './src/database/migrations',
    extension: 'ts',
  },
  seeds: {
    directory: './src/database/seeds',
    extension: 'ts',
  },
});

// Ensure required columns exist on users table
async function ensureUserSchema(): Promise<void> {
  try {
    const hasLicenseNumber = await db.schema.hasColumn('users', 'license_number');
    if (!hasLicenseNumber) {
      await db.schema.alterTable('users', (table) => {
        table.string('license_number').nullable();
        table.string('license_photo_url').nullable();
        table.string('company_registration_number').nullable();
        table.string('company_description').nullable();
        table.string('company_logo_url').nullable();
        table.string('profile_photo_url').nullable();
      });
      console.log('✅ Added driver and fleet owner metadata columns to users table.');
    }
  } catch (err) {
    console.error('⚠️ Could not verify/alter users table schema:', (err as Error).message);
  }
}

// Test connection function
export async function testDbConnection(): Promise<boolean> {
  try {
    await db.raw('SELECT 1');
    console.log('✅ Database connected successfully');
    await ensureUserSchema();
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', (err as Error).message);
    return false;
  }
}

// Handle connection errors
db.on('error', (err) => {
  console.error('Database error:', err.message);
});

export default db;