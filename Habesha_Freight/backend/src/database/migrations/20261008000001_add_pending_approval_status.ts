import { Knex } from 'knex';

/**
 * Driver/Fleet Owner registration uses status PENDING_APPROVAL, but the
 * original admin-fields migration only allowed ACTIVE|INACTIVE|SUSPENDED.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
  `);
  await knex.raw(`
    ALTER TABLE users ADD CONSTRAINT users_status_check
      CHECK (status = ANY (ARRAY[
        'ACTIVE'::text,
        'INACTIVE'::text,
        'SUSPENDED'::text,
        'PENDING_APPROVAL'::text
      ]));
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex('users')
    .where('status', 'PENDING_APPROVAL')
    .update({ status: 'INACTIVE' });

  await knex.raw(`
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
  `);
  await knex.raw(`
    ALTER TABLE users ADD CONSTRAINT users_status_check
      CHECK (status = ANY (ARRAY[
        'ACTIVE'::text,
        'INACTIVE'::text,
        'SUSPENDED'::text
      ]));
  `);
}
