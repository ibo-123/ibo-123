const express = require('express');
const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');
const contributorRoutes = require('./contributorRoutes');
const contributorsRoutes = require('./contributorsRoutes');
const jobRoutes = require('./jobRoutes');
const templateRoutes = require('./templateRoutes');
const submissionRoutes = require('./submissionRoutes');
const contentRoutes = require('./contentRoutes');
const notificationRoutes = require('./notificationRoutes');
const topicRoutes = require('./topicRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: { status: 'ok' },
  });
});

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/contributor', contributorRoutes);
router.use('/contributors', contributorsRoutes);
router.use('/jobs', jobRoutes);
router.use('/templates', templateRoutes);
router.use('/submissions', submissionRoutes);
router.use('/content', contentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/topics', topicRoutes);

module.exports = router;
