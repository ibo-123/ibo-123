import db from '../src/config/db';

async function checkDriverLocation() {
  try {
    // Get the test driver
    const driver = await db('users')
      .where('phone_number', '+251922654321')
      .first();
    
    if (!driver) {
      console.log('Driver not found');
      process.exit(1);
    }
    
    console.log('Driver ID:', driver.id);
    
    // Check last_known_location
    const result = await db.raw(
      `SELECT 
        ST_Y(last_known_location::geometry) as latitude,
        ST_X(last_known_location::geometry) as longitude
       FROM users 
       WHERE id = ?`,
      [driver.id]
    );
    
    console.log('Location:', result.rows[0] || 'No location set');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDriverLocation();
