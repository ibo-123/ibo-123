import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add PostGIS geography column for driver locations
  // Check if PostGIS extension is available
  const hasPostGIS = await knex.raw(
    `SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') as exists`
  );
  
  const postGISExists = hasPostGIS.rows?.[0]?.exists || false;

  if (!postGISExists) {
    console.warn('⚠️ PostGIS extension is not installed. Driver location features will be limited.');
    // Add fallback columns without PostGIS
    await knex.schema.alterTable('users', (table) => {
      table.decimal('last_lat', 10, 8).nullable();
      table.decimal('last_lng', 11, 8).nullable();
    });
    return;
  }

  // Add PostGIS geography column
  await knex.schema.alterTable('users', (table) => {
    table.specificType('last_known_location', 'geography(Point, 4326)').nullable();
  });

  // Add GIST index for fast spatial queries
  await knex.raw(
    `CREATE INDEX idx_users_last_known_location ON users USING GIST (last_known_location)`
  );

  // Add a trigger to automatically update the updated_at timestamp
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_users_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
    CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Check if we have PostGIS
  const hasPostGIS = await knex.raw(
    `SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') as exists`
  );
  
  const postGISExists = hasPostGIS.rows?.[0]?.exists || false;

  if (postGISExists) {
    await knex.raw(`DROP INDEX IF EXISTS idx_users_last_known_location`);
  }

  await knex.schema.alterTable('users', (table) => {
    if (postGISExists) {
      table.dropColumn('last_known_location');
    } else {
      table.dropColumn('last_lat');
      table.dropColumn('last_lng');
    }
  });

  await knex.raw(`DROP TRIGGER IF EXISTS trigger_users_updated_at ON users`);
  await knex.raw(`DROP FUNCTION IF EXISTS update_users_updated_at`);
}