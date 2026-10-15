const express = require('express');
const User = require('../models/User');
const Job = require('../models/Job');
const Service = require('../models/Service');
const Proposal = require('../models/Proposal');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/stats/home
// @desc    Get home page statistics
// @access  Public
router.get('/home', async (req, res) => {
  try {
    // Get counts for all main entities
    const [totalJobs, totalServices, totalUsers, totalProposals] = await Promise.all([
      Job.countDocuments(),
      Service.countDocuments(),
      User.countDocuments(),
      Proposal.countDocuments()
    ]);

    // Get recent activity (last 10 jobs and services)
    const [recentJobs, recentServices] = await Promise.all([
      Job.find()
        .populate('client', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title budget status createdAt client'),
      Service.find()
        .populate('freelancer', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title price createdAt freelancer')
    ]);

    // Combine and sort recent activity
    const recentActivity = [
      ...recentJobs.map(job => ({
        type: 'job',
        title: job.title,
        amount: job.budget,
        status: job.status,
        createdAt: job.createdAt,
        user: job.client?.name || 'Unknown Client'
      })),
      ...recentServices.map(service => ({
        type: 'service',
        title: service.title,
        amount: service.price,
        status: 'available',
        createdAt: service.createdAt,
        user: service.freelancer?.name || 'Unknown Freelancer'
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

    // Get user role breakdown
    const userStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const totalClients = userStats.find(stat => stat._id === 'client')?.count || 0;
    const totalFreelancers = userStats.find(stat => stat._id === 'freelancer')?.count || 0;

    // Get job status breakdown
    const jobStats = await Job.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const openJobs = jobStats.find(stat => stat._id === 'open')?.count || 0;
    const inProgressJobs = jobStats.find(stat => stat._id === 'in_progress')?.count || 0;
    const completedJobs = jobStats.find(stat => stat._id === 'completed')?.count || 0;

    const stats = {
      totalJobs,
      totalServices,
      totalUsers,
      totalProposals,
      totalClients,
      totalFreelancers,
      openJobs,
      inProgressJobs,
      completedJobs,
      recentActivity
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching home stats:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});

// @route   GET /api/stats/user
// @desc    Get user-specific statistics for dashboard
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let stats = {};

    if (user.role === 'client') {
      // Client statistics
      const [jobs, proposals, earnings] = await Promise.all([
        Job.find({ client: userId }),
        Proposal.find({ job: { $in: await Job.find({ client: userId }).distinct('_id') } })
          .populate('job', 'title budget')
          .populate('freelancer', 'name'),
        // Calculate earnings from completed jobs
        Job.aggregate([
          { $match: { client: userId, status: 'completed' } },
          { $lookup: { from: 'proposals', localField: '_id', foreignField: 'job', as: 'acceptedProposal' } },
          { $unwind: { path: '$acceptedProposal', preserveNullAndEmptyArrays: true } },
          { $match: { 'acceptedProposal.status': 'accepted' } },
          { $group: { _id: null, total: { $sum: '$acceptedProposal.proposedPrice' } } }
        ])
      ]);

      stats = {
        totalJobs: jobs.length,
        activeJobs: jobs.filter(job => job.status === 'open' || job.status === 'in_progress').length,
        completedJobs: jobs.filter(job => job.status === 'completed').length,
        totalProposals: proposals.length,
        totalSpent: earnings[0]?.total || 0,
        recentJobs: jobs.slice(0, 5)
      };
    } else if (user.role === 'freelancer') {
      // Freelancer statistics
      const [services, proposals, earnings] = await Promise.all([
        Service.find({ freelancer: userId }),
        Proposal.find({ freelancer: userId })
          .populate('job', 'title budget status')
          .populate('client', 'name'),
        // Calculate earnings from accepted proposals
        Proposal.aggregate([
          { $match: { freelancer: userId, status: 'accepted' } },
          { $group: { _id: null, total: { $sum: '$proposedPrice' } } }
        ])
      ]);

      stats = {
        totalServices: services.length,
        totalProposals: proposals.length,
        acceptedProposals: proposals.filter(p => p.status === 'accepted').length,
        pendingProposals: proposals.filter(p => p.status === 'pending').length,
        rejectedProposals: proposals.filter(p => p.status === 'rejected').length,
        totalEarnings: earnings[0]?.total || 0,
        recentProposals: proposals.slice(0, 5)
      };
    }

    res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Server error while fetching user statistics' });
  }
});

module.exports = router;