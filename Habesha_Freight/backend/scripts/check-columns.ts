import db from '../src/config/db';

async function checkColumns() {
  try {
    const hasLocation = await db.schema.hasColumn('users', 'last_known_location');
    const hasLastLat = await db.schema.hasColumn('users', 'last_lat');
    const hasLastLng = await db.schema.hasColumn('users', 'last_lng');
    
    console.log('last_known_location:', hasLocation);
    console.log('last_lat:', hasLastLat);
    console.log('last_lng:', hasLastLng);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkColumns();
