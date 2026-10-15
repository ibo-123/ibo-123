import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add location columns to vehicles table for vehicle discovery
  await knex.schema.alterTable('vehicles', (table) => {
    table.decimal('origin_lat', 10, 8).nullable();
    table.decimal('origin_lng', 11, 8).nullable();
  });

  // Add index for faster spatial queries
  await knex.schema.alterTable('vehicles', (table) => {
    table.index(['origin_lat', 'origin_lng'], 'vehicles_origin_coords_idx');
  });

  // If PostGIS is available, add geography column for even faster queries
  const hasPostGIS = await knex.raw(
    `SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') as exists`
  );
  
  const postGISExists = hasPostGIS.rows?.[0]?.exists || false;

  if (postGISExists) {
    await knex.schema.alterTable('vehicles', (table) => {
      table.specificType('origin_geom', 'geography(Point, 4326)').nullable();
    });

    await knex.raw(
      `CREATE INDEX idx_vehicles_origin_geom ON vehicles USING GIST (origin_geom)`
    );

    // Populate geometry column from lat/lng
    await knex.raw(`
      UPDATE vehicles 
      SET origin_geom = CASE 
        WHEN origin_lat IS NOT NULL AND origin_lng IS NOT NULL 
        THEN ST_SetSRID(ST_MakePoint(origin_lng, origin_lat), 4326)::geography 
        ELSE NULL 
      END
      WHERE origin_lat IS NOT NULL AND origin_lng IS NOT NULL
    `);
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasPostGIS = await knex.raw(
    `SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') as exists`
  );
  
  const postGISExists = hasPostGIS.rows?.[0]?.exists || false;

  if (postGISExists) {
    await knex.raw(`DROP INDEX IF EXISTS idx_vehicles_origin_geom`);
    await knex.schema.alterTable('vehicles', (table) => {
      table.dropColumn('origin_geom');
    });
  }

  await knex.schema.alterTable('vehicles', (table) => {
    table.dropIndex(['origin_lat', 'origin_lng'], 'vehicles_origin_coords_idx');
    table.dropColumn('origin_lat');
    table.dropColumn('origin_lng');
  });
}