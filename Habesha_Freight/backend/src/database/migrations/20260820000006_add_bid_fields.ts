import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('bids', (table) => {
    table.uuid('vehicle_id').nullable().references('id').inTable('vehicles').onDelete('SET NULL');
    table.boolean('is_counter_offer').defaultTo(false);
    table.uuid('original_bid_id').nullable().references('id').inTable('bids').onDelete('SET NULL');
    table.boolean('is_auto_accept').defaultTo(false);
  });

  // Update status check constraint to allow CANCELLED
  await knex.raw(`
    ALTER TABLE bids DROP CONSTRAINT IF EXISTS bids_status_check;
    ALTER TABLE bids ADD CONSTRAINT bids_status_check 
      CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'));
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE bids DROP CONSTRAINT IF EXISTS bids_status_check;
    ALTER TABLE bids ADD CONSTRAINT bids_status_check 
      CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED'));
  `);

  await knex.schema.alterTable('bids', (table) => {
    table.dropColumn('vehicle_id');
    table.dropColumn('is_counter_offer');
    table.dropColumn('original_bid_id');
    table.dropColumn('is_auto_accept');
  });
}
