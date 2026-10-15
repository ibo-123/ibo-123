import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('loads', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('shipper_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('cargo_description', 255).notNullable();
    table.decimal('weight_tons', 5, 2).notNullable();
    table.string('origin_city', 100).notNullable();
    table.string('destination_city', 100).notNullable();
    table.double('origin_lat').notNullable();
    table.double('origin_lng').notNullable();
    table.double('destination_lat').notNullable();
    table.double('destination_lng').notNullable();
    table
      .enum('status', [
        'POSTED',
        'MATCHED',
        'DISPATCHED',
        'IN_TRANSIT',
        'DELIVERED',
        'CANCELLED',
      ])
      .notNullable()
      .defaultTo('POSTED');
    table.decimal('offered_price_etb', 10, 2).notNullable();
    table.timestamps(true, true);
  });

  // Create composite index for sub-300ms geospatial radius queries
  await knex.schema.alterTable('loads', (table) => {
    table.index(['origin_lat', 'origin_lng'], 'loads_origin_coords_idx');
    table.index(['destination_lat', 'destination_lng'], 'loads_dest_coords_idx');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('loads');
}
