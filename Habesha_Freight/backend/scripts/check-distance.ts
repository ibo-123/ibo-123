import { SpatialService } from '../src/services/spatialService';

const distance = SpatialService.haversineDistance(8.9806, 38.7578, 8.5400, 39.2700);
console.log('Distance between Addis Ababa and Adama:', distance, 'km');
