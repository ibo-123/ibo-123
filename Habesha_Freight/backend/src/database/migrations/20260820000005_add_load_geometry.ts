import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if PostGIS is available
  const hasPostGIS = await knex.raw(
    `SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') as exists`
  );
  const postGISExists = hasPostGIS.rows?.[0]?.exists || false;

  if (postGISExists) {
    await knex.schema.alterTable('loads', (table) => {
      table.specificType('origin_geom', 'geography(Point, 4326)').nullable();
      table.specificType('destination_geom', 'geography(Point, 4326)').nullable();
    });

    // Populate geometry columns from lat/lng
    await knex.raw(`
      UPDATE loads 
      SET origin_geom = CASE 
        WHEN origin_lat IS NOT NULL AND origin_lng IS NOT NULL 
        THEN ST_SetSRID(ST_MakePoint(origin_lng, origin_lat), 4326)::geography 
        ELSE NULL 
      END,
      destination_geom = CASE 
        WHEN destination_lat IS NOT NULL AND destination_lng IS NOT NULL 
        THEN ST_SetSRID(ST_MakePoint(destination_lng, destination_lat), 4326)::geography 
        ELSE NULL 
      END
    `);
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasPostGIS = await knex.raw(
    `SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') as exists`
  );
  const postGISExists = hasPostGIS.rows?.[0]?.exists || false;

  if (postGISExists) {
    await knex.schema.alterTable('loads', (table) => {
      table.dropColumn('origin_geom');
      table.dropColumn('destination_geom');
    });
  }
}
