const Job = require('../models/Job');
const Client = require('../models/Client');

const closeExpiredJobs = async () => {
  const now = new Date();
  await Job.updateMany(
    { status: 'open', deadline: { $lt: now } },
    { status: 'closed' }
  );
};

exports.createJob = async (req, res, next) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can post jobs' });
    }

    const client = await Client.findOne({ user: req.user.id });
    if (!client) return res.status(404).json({ message: 'Client profile not found' });

    const {
      title,
      description,
      budget,
      deadline,
      category,
      location,
      skills,
      jobType,
      experienceLevel
    } = req.body;

    const job = new Job({
      client: client._id,
      title,
      description,
      budget,
      deadline,
      category,
      location,
      skills: Array.isArray(skills) ? skills : [],
      jobType,
      experienceLevel
    });

    await job.save();
    res.status(201).json(job);
  } catch (error) {
    next(error);
  }
};

exports.getJobs = async (req, res, next) => {
  try {
    await closeExpiredJobs();

    const limit = parseInt(req.query.limit, 10) || 50;
    const jobs = await Job.find({ status: 'open' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({ path: 'client', populate: { path: 'user', select: 'name' } });

    res.json(jobs);
  } catch (error) {
    next(error);
  }
};

exports.getUserJobs = async (req, res, next) => {
  try {
    const client = await Client.findOne({ user: req.user.id });
    if (!client) return res.status(404).json({ message: 'Client profile not found' });

    const jobs = await Job.find({ client: client._id })
      .sort({ createdAt: -1 })
      .populate({ path: 'freelancer', populate: { path: 'user', select: 'name' } });

    res.json(jobs);
  } catch (error) {
    next(error);
  }
};

exports.getJobById = async (req, res, next) => {
  try {
    await closeExpiredJobs();

    const job = await Job.findById(req.params.id)
      .populate({ path: 'client', populate: { path: 'user', select: 'name' } })
      .populate({ path: 'freelancer', populate: { path: 'user', select: 'name' } });

    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (error) {
    next(error);
  }
};

exports.updateJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const client = await Client.findOne({ user: req.user.id });
    if (!client || job.client.toString() !== client._id.toString()) {
      return res.status(403).json({ message: 'Only the job owner can update this job' });
    }

    const updates = ['status', 'title', 'description', 'budget', 'deadline', 'category', 'location', 'skills', 'jobType', 'experienceLevel'];
    updates.forEach((field) => {
      if (req.body[field] !== undefined) {
        job[field] = field === 'skills' ? (Array.isArray(req.body.skills) ? req.body.skills : job.skills) : req.body[field];
      }
    });

    await job.save();
    res.json(job);
  } catch (error) {
    next(error);
  }
};

exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const client = await Client.findOne({ user: req.user.id });
    if (!client || job.client.toString() !== client._id.toString()) {
      return res.status(403).json({ message: 'Only the job owner can delete this job' });
    }

    await job.remove();
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    next(error);
  }
};
