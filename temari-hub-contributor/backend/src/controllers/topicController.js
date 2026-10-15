const asyncHandler = require('../utils/asyncHandler');
const topicService = require('../services/topicService');

const listTopics = asyncHandler(async (req, res) => {
  const { subject, search } = req.query;
  const topics = await topicService.getTopics(subject, search);
  res.json({
    success: true,
    data: { topics },
  });
});

module.exports = {
  listTopics,
};
