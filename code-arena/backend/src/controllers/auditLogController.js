const AuditLog = require('../models/AuditLog');

exports.getAuditLogs = async (req, res) => {
  try {
    const { tournamentId, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (tournamentId) {
      filter.tournament = tournamentId;
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 50, 200);
    const skip = (pageNum - 1) * limitNum;

    const [logs, totalCount] = await Promise.all([
      AuditLog.find(filter)
        .populate('admin', 'name username email')
        .populate('tournament', 'name status currentStage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    const actionTypes = await AuditLog.distinct('action');

    return res.json({
      success: true,
      logs,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalCount / limitNum),
        hasNext: pageNum < Math.ceil(totalCount / limitNum),
        hasPrev: pageNum > 1,
      },
      filters: {
        availableActions: actionTypes,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
