const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000/api';
let authToken = '';
let adminToken = '';
let userId = '';
let achievementId = '';
let courseId = '';

// Test user credentials
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

const adminUser = {
  email: 'admin@example.com',
  password: 'admin123'
};

async function testEndpoint(method, endpoint, data = null, token = null, description = '') {
  const config = {
    method: method.toLowerCase(),
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (data) {
    config.data = data;
  }

  try {
    console.log(`\n${description}`);
    console.log(`${method} ${endpoint}`);
    
    const response = await axios(config);
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`Response:`, response.data);
    
    return response.data;
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status || error.message}`);
    if (error.response?.data) {
      console.log(`Error Details:`, error.response.data);
    }
    return null;
  }
}

async function runAllTests() {
  console.log('🚀 Starting API Endpoint Tests');
  console.log('='.repeat(50));

  // 1. Health Check
  console.log('\n📊 1. HEALTH CHECK');
  console.log('-'.repeat(30));
  await testEndpoint('GET', '/health', null, null, 'Health Check');

  // 2. Auth Endpoints
  console.log('\n🔐 2. AUTH ENDPOINTS');
  console.log('-'.repeat(30));
  
  // Register test user
  const registerData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    studentId: 'STU001',
    department: 'Computer Science',
    year: '2023'
  };
  const registerRes = await testEndpoint('POST', '/auth/register', registerData, null, 'Register User');
  
  // Login test user
  const loginRes = await testEndpoint('POST', '/auth/login', testUser, null, 'Login User');
  if (loginRes?.success) {
    authToken = loginRes.data.token;
    userId = loginRes.data.user._id;
  }

  // Get current user
  await testEndpoint('GET', '/auth/me', null, authToken, 'Get Current User');

  // 3. User Endpoints
  console.log('\n👥 3. USER ENDPOINTS');
  console.log('-'.repeat(30));
  
  // Get user profile
  await testEndpoint('GET', `/users/${userId}`, null, authToken, 'Get User by ID');
  
  // Get current user profile
  await testEndpoint('GET', '/users/me', null, authToken, 'Get Current User Profile');
  
  // Get users for dropdown
  await testEndpoint('GET', '/users/dropdown', null, authToken, 'Get Users for Dropdown');
  
  // Update user profile
  const updateData = {
    name: 'Updated Test User',
    department: 'Updated Department'
  };
  await testEndpoint('PUT', `/users/${userId}`, updateData, authToken, 'Update User Profile');

  // 4. Admin User Endpoints (if admin token available)
  console.log('\n👑 4. ADMIN USER ENDPOINTS');
  console.log('-'.repeat(30));
  
  // Admin login (you need to create an admin user first)
  const adminLoginRes = await testEndpoint('POST', '/auth/login', adminUser, null, 'Admin Login');
  if (adminLoginRes?.success) {
    adminToken = adminLoginRes.data.token;
    
    // Get all users
    await testEndpoint('GET', '/users?page=1&limit=10', null, adminToken, 'Get All Users (Admin)');
    
    // Get user stats
    await testEndpoint('GET', '/users/stats', null, adminToken, 'Get User Statistics');
    
    // Create new user
    const newUser = {
      name: 'New Test User',
      email: 'newuser@example.com',
      password: 'password123',
      studentId: 'STU002',
      department: 'Engineering',
      year: '2023',
      role: 'member'
    };
    await testEndpoint('POST', '/users', newUser, adminToken, 'Create New User (Admin)');
  }

  // 5. Achievement Endpoints
  console.log('\n🏆 5. ACHIEVEMENT ENDPOINTS');
  console.log('-'.repeat(30));
  
  // Get all achievements
  const achievementsRes = await testEndpoint('GET', '/achievements?page=1&limit=5', null, authToken, 'Get All Achievements');
  
  // Create achievement
  const achievementData = {
    title: 'Test Achievement',
    description: 'This is a test achievement',
    category: 'NCC',
    level: 'College',
    date: new Date().toISOString().split('T')[0],
    organizer: 'Test University',
    isPublic: true
  };
  const createAchievementRes = await testEndpoint('POST', '/achievements', achievementData, authToken, 'Create Achievement');
  if (createAchievementRes?.success) {
    achievementId = createAchievementRes.data._id;
  }
  
  // Get specific achievement
  if (achievementId) {
    await testEndpoint('GET', `/achievements/${achievementId}`, null, authToken, 'Get Specific Achievement');
    
    // Update achievement
    const updateAchievementData = {
      title: 'Updated Achievement Title',
      description: 'Updated description'
    };
    await testEndpoint('PUT', `/achievements/${achievementId}`, updateAchievementData, authToken, 'Update Achievement');
    
    // Like achievement
    await testEndpoint('POST', `/achievements/${achievementId}/like`, null, authToken, 'Like Achievement');
    
    // Get user achievements
    await testEndpoint('GET', `/achievements/user/${userId}`, null, authToken, 'Get User Achievements');
  }

  // 6. Course Endpoints
  console.log('\n📚 6. COURSE ENDPOINTS');
  console.log('-'.repeat(30));
  
  // Get all courses
  const coursesRes = await testEndpoint('GET', '/courses?page=1&limit=5', null, authToken, 'Get All Courses');
  
  // Create course (admin only)
  if (adminToken) {
    const courseData = {
      title: 'Test Course',
      description: 'This is a test course',
      code: 'CS101',
      credits: 3,
      semester: 'Fall 2023',
      instructor: 'Test Instructor'
    };
    const createCourseRes = await testEndpoint('POST', '/courses', courseData, adminToken, 'Create Course (Admin)');
    if (createCourseRes?.success) {
      courseId = createCourseRes.data._id;
    }
  }

  // 7. Attendance Endpoints
  console.log('\n✅ 7. ATTENDANCE ENDPOINTS');
  console.log('-'.repeat(30));
  
  // Get attendance records
  await testEndpoint('GET', '/attendance?page=1&limit=5', null, authToken, 'Get Attendance Records');
  
  // Create attendance record (admin only)
  if (adminToken && courseId) {
    const attendanceData = {
      user: userId,
      course: courseId,
      date: new Date().toISOString().split('T')[0],
      status: 'Present',
      remarks: 'Test attendance'
    };
    await testEndpoint('POST', '/attendance', attendanceData, adminToken, 'Create Attendance (Admin)');
  }

  // 8. Statistics Endpoints
  console.log('\n📈 8. STATISTICS ENDPOINTS');
  console.log('-'.repeat(30));
  
  if (adminToken) {
    // Get achievement statistics
    await testEndpoint('GET', '/achievements/stats', null, adminToken, 'Get Achievement Statistics');
    
    // Get leaderboard
    await testEndpoint('GET', '/achievements/leaderboard?limit=5', null, adminToken, 'Get Leaderboard');
  }

  // 9. Cleanup
  console.log('\n🧹 9. CLEANUP');
  console.log('-'.repeat(30));
  
  if (achievementId) {
    await testEndpoint('DELETE', `/achievements/${achievementId}`, null, authToken, 'Delete Achievement');
  }
  
  if (adminToken && courseId) {
    await testEndpoint('DELETE', `/courses/${courseId}`, null, adminToken, 'Delete Course');
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests completed!');
}

// Run tests
runAllTests().catch(console.error);