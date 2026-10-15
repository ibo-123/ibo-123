import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  try {
    await knex.raw('CREATE EXTENSION IF NOT EXISTS postgis');
    console.log('✅ PostGIS extension enabled');
  } catch (error) {
    console.warn('⚠️ PostGIS extension could not be enabled');
  }
}

export async function down(knex: Knex): Promise<void> {
  // Don't drop extension as it might be used by other tables
}
