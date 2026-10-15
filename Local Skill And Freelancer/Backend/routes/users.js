const express = require('express');
const auth = require('../middleware/auth');
const { getCurrentUser, updateUserProfile, updateFreelancerProfile, updateClientProfile, getFreelancers, changePassword } = require('../controllers/userController');
const router = express.Router();

router.get('/me', auth, getCurrentUser);
router.put('/profile', auth, updateUserProfile);
router.put('/profile/freelancer', auth, updateFreelancerProfile);
router.put('/profile/client', auth, updateClientProfile);
router.put('/password', auth, changePassword);

module.exports = router;
