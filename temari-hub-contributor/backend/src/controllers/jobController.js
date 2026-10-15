const asyncHandler = require('../utils/asyncHandler');
const jobService = require('../services/jobService');

const listJobs = asyncHandler(async (req, res) => {
  const jobs = await jobService.listJobs();
  res.json({ success: true, data: { jobs } });
});

const getJob = asyncHandler(async (req, res) => {
  const job = await jobService.getJob(req.params.id);
  res.json({ success: true, data: { job } });
});

const createJob = asyncHandler(async (req, res) => {
  const job = await jobService.createJob(req.body, req.user);
  res.status(201).json({ success: true, data: { job } });
});

const updateJob = asyncHandler(async (req, res) => {
  const job = await jobService.updateJob(req.params.id, req.body, req.user);
  res.json({ success: true, data: { job } });
});

const cancelJob = asyncHandler(async (req, res) => {
  const job = await jobService.cancelJob(req.params.id, req.user);
  res.json({ success: true, data: { job } });
});

const listMyJobs = asyncHandler(async (req, res) => {
  const jobs = await jobService.listJobsForContributor(req.user);
  res.json({ success: true, data: { jobs } });
});

const getMyJob = asyncHandler(async (req, res) => {
  const job = await jobService.getJobForContributor(req.user, req.params.id);
  res.json({ success: true, data: { job } });
});

module.exports = { listJobs, getJob, createJob, updateJob, cancelJob, listMyJobs, getMyJob };
