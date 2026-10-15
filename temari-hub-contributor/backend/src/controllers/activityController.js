const asyncHandler = require('../utils/asyncHandler');
const activityService = require('../services/activityService');

const listActivity = asyncHandler(async (req, res) => {
  const activity = await activityService.listActivity({
    entityType: req.query.entityType,
    entityId: req.query.entityId,
  });
  res.json({ success: true, data: { activity } });
});

module.exports = { listActivity };
