const Proposal = require('../models/Proposal');
const Freelancer = require('../models/Freelancer');
const Job = require('../models/Job');
const Client = require('../models/Client');

exports.createProposal = async (req, res, next) => {
  try {
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({ message: 'Only freelancers can submit proposals' });
    }
    const freelancer = await Freelancer.findOne({ user: req.user.id });
    if (!freelancer) return res.status(404).json({ message: 'Freelancer profile not found' });
    const { jobId, proposalText, proposedPrice, coverLetter, estimatedDays } = req.body;
    const job = await Job.findById(jobId);
    if (!job || job.status !== 'open' || (job.deadline && job.deadline < new Date())) {
      return res.status(400).json({ message: 'Job is not available for proposals' });
    }
    const existingProposal = await Proposal.findOne({ job: jobId, freelancer: freelancer._id, status: { $ne: 'withdrawn' } });
    if (existingProposal) {
      return res.status(400).json({ message: 'You have already submitted a proposal for this job' });
    }
    const proposal = new Proposal({
      job: jobId,
      freelancer: freelancer._id,
      proposalText,
      coverLetter,
      estimatedDays: estimatedDays ? parseInt(estimatedDays, 10) : undefined,
      proposedPrice
    });
    await proposal.save();
    res.status(201).json(proposal);
  } catch (error) {
    next(error);
  }
};

exports.getProposalsByJob = async (req, res, next) => {
  try {
    const proposals = await Proposal.find({ job: req.params.jobId })
      .populate({
        path: 'freelancer',
        populate: { path: 'user', select: 'name' },
        select: 'bio skills hourlyRate github linkedin portfolio experience'
      })
      .populate('job', 'title status');
    res.json(proposals);
  } catch (error) {
    next(error);
  }
};

exports.updateProposalStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['accepted', 'rejected', 'withdrawn'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const proposal = await Proposal.findById(req.params.id).populate('job');
    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });

    if (status === 'withdrawn') {
      if (req.user.role !== 'freelancer') {
        return res.status(403).json({ message: 'Only freelancers can withdraw proposals' });
      }
      const freelancer = await Freelancer.findOne({ user: req.user.id });
      if (!freelancer || proposal.freelancer.toString() !== freelancer._id.toString()) {
        return res.status(403).json({ message: 'Only proposal owner can withdraw this proposal' });
      }
      if (proposal.status !== 'pending') {
        return res.status(400).json({ message: 'Only pending proposals can be withdrawn' });
      }
      proposal.status = 'withdrawn';
      await proposal.save();
      return res.json(proposal);
    }

    const client = await Client.findOne({ user: req.user.id });
    if (!client || proposal.job.client.toString() !== client._id.toString()) {
      return res.status(403).json({ message: 'Only the job owner can update proposal status' });
    }
    if (proposal.status !== 'pending') {
      return res.status(400).json({ message: 'Proposal has already been processed' });
    }
    if (proposal.job.status !== 'open') {
      return res.status(400).json({ message: 'Cannot update proposals for a job that is not open' });
    }
    proposal.status = status;
    await proposal.save();
    if (status === 'accepted') {
      proposal.job.status = 'in_progress';
      proposal.job.freelancer = proposal.freelancer;
      await proposal.job.save();
    }
    res.json(proposal);
  } catch (error) {
    next(error);
  }
};

exports.getProposalsByUser = async (req, res, next) => {
  try {
    if (req.user.role === 'client') {
      const client = await Client.findOne({ user: req.user.id });
      if (!client) return res.status(404).json({ message: 'Client profile not found' });
      const jobs = await Job.find({ client: client._id }).select('_id');
      const jobIds = jobs.map(job => job._id);
      const proposals = await Proposal.find({ job: { $in: jobIds } })
        .populate('job', 'title status')
        .populate({
          path: 'freelancer',
          populate: { path: 'user', select: 'name' },
          select: 'bio skills hourlyRate github linkedin portfolio experience'
        });
      res.json(proposals);
    } else if (req.user.role === 'freelancer') {
      const freelancer = await Freelancer.findOne({ user: req.user.id });
      if (!freelancer) return res.status(404).json({ message: 'Freelancer profile not found' });
      const proposals = await Proposal.find({ freelancer: freelancer._id })
        .populate('job', 'title status')
        .populate({
          path: 'freelancer',
          populate: { path: 'user', select: 'name' },
          select: 'bio skills hourlyRate github linkedin portfolio experience'
        });
      res.json(proposals);
    } else {
      res.status(403).json({ message: 'Invalid role' });
    }
  } catch (error) {
    next(error);
  }
};