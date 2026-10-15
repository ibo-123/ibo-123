import db from '../src/config/db';
import bcrypt from 'bcryptjs';

async function seedTestUsers() {
  try {
    const password = await bcrypt.hash('Password123!', 10);

    // Create test users if they don't exist
    const users = [
      { phone: '+251900000000', name: 'Test Admin', role: 'ADMIN' },
      { phone: '+251911123456', name: 'Test Shipper', role: 'SHIPPER' },
      { phone: '+251922654321', name: 'Test Driver', role: 'DRIVER' },
      { phone: '+251911987654', name: 'Test Company', role: 'FLEET_OWNER' },
      { phone: '+251911888999', name: 'Test Driver 2', role: 'DRIVER' },
    ];

    for (const user of users) {
      const existing = await db('users').where({ phone_number: user.phone }).first();
      if (!existing) {
        await db('users').insert({
          full_name: user.name,
          phone_number: user.phone,
          password_hash: password,
          role: user.role,
          is_verified: true,
          status: 'ACTIVE',
          kyc_status: 'APPROVED',
        });
        console.log(`✅ Created ${user.role}: ${user.phone}`);
      } else {
        console.log(`✅ ${user.role} already exists: ${user.phone}`);
      }
    }

    console.log('✅ Test users seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding test users:', error);
  }
}

seedTestUsers().then(() => process.exit(0));
