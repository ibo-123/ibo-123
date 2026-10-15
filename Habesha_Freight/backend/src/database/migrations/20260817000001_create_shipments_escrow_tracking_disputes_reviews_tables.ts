import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Shipments Table
  await knex.schema.createTable('shipments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('load_id').notNullable().references('id').inTable('loads').onDelete('CASCADE');
    table.uuid('carrier_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.uuid('vehicle_id').nullable().references('id').inTable('vehicles').onDelete('SET NULL');
    table.enum('status', ['ASSIGNED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'DISPUTED'])
      .notNullable()
      .defaultTo('ASSIGNED');
    table.string('pickup_otp_hash', 255).notNullable();
    table.string('delivery_otp_hash', 255).notNullable();
    table.timestamp('pickup_verified_at').nullable();
    table.timestamp('delivery_verified_at').nullable();
    table.timestamps(true, true);
  });

  // 2. Escrow Ledger Table
  await knex.schema.createTable('escrow_ledger', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('shipment_id').notNullable().references('id').inTable('shipments').onDelete('CASCADE');
    table.uuid('payer_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.uuid('beneficiary_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.decimal('gross_amount_etb', 12, 2).notNullable();
    table.decimal('commission_amount_etb', 12, 2).notNullable();
    table.decimal('net_payout_amount_etb', 12, 2).notNullable();
    table.string('gateway_reference', 255).nullable();
    table.string('idempotency_key', 255).notNullable().unique();
    table.enum('status', ['PENDING', 'LOCKED', 'RELEASED', 'REFUNDED', 'DISPUTED'])
      .notNullable()
      .defaultTo('PENDING');
    table.timestamp('locked_at').nullable();
    table.timestamp('released_at').nullable();
    table.timestamps(true, true);
  });

  // 3. Location Breadcrumbs Table
  await knex.schema.createTable('location_breadcrumbs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('shipment_id').notNullable().references('id').inTable('shipments').onDelete('CASCADE');
    table.uuid('driver_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.decimal('latitude', 10, 8).notNullable();
    table.decimal('longitude', 11, 8).notNullable();
    table.float('speed').nullable();
    table.timestamp('recorded_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // 4. Disputes Table
  await knex.schema.createTable('disputes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('shipment_id').notNullable().references('id').inTable('shipments').onDelete('CASCADE');
    table.uuid('raised_by_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.enum('category', ['DAMAGE', 'DELAY', 'PAYMENT', 'OTHER']).notNullable();
    table.text('reason').notNullable();
    table.enum('status', ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'])
      .notNullable()
      .defaultTo('OPEN');
    table.text('resolution_notes').nullable();
    table.uuid('resolved_by_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);
  });

  // 5. Reviews Table
  await knex.schema.createTable('reviews', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('shipment_id').notNullable().references('id').inTable('shipments').onDelete('CASCADE');
    table.uuid('reviewer_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('reviewee_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('rating').notNullable();
    table.text('comment').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('reviews');
  await knex.schema.dropTableIfExists('disputes');
  await knex.schema.dropTableIfExists('location_breadcrumbs');
  await knex.schema.dropTableIfExists('escrow_ledger');
  await knex.schema.dropTableIfExists('shipments');
}
