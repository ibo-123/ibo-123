const asyncHandler = require('../utils/asyncHandler');
const submissionService = require('../services/submissionService');

function contentDisposition(filename) {
  const cleaned = String(filename || 'download')
    .replace(/[/\\"\r\n]/g, '_')
    .slice(0, 180) || 'download';

  return `attachment; filename="${cleaned}"`;
}

const getMySubmission = asyncHandler(async (req, res) => {
  const submission = await submissionService.getSubmissionForJob(req.user, req.params.jobId);
  res.json({ success: true, data: { submission } });
});

const createSubmission = asyncHandler(async (req, res) => {
  const submission = await submissionService.createSubmission(req.user, req.params.jobId, req.body);
  res.status(201).json({ success: true, data: { submission } });
});

const listMySubmissions = asyncHandler(async (req, res) => {
  const submissions = await submissionService.listForContributor(req.user);
  res.json({ success: true, data: { submissions } });
});

const updateSubmission = asyncHandler(async (req, res) => {
  const submission = await submissionService.updateSubmission(req.user, req.params.id, req.body);
  res.json({ success: true, data: { submission } });
});

const submitSubmission = asyncHandler(async (req, res) => {
  const submission = await submissionService.submitSubmission(req.user, req.params.id);
  res.json({ success: true, data: { submission } });
});

const addFiles = asyncHandler(async (req, res) => {
  const submission = await submissionService.addFiles(req.user, req.params.id, req.files);
  res.json({ success: true, data: { submission } });
});

const removeFile = asyncHandler(async (req, res) => {
  const submission = await submissionService.removeFile(req.user, req.params.id, req.params.fileId);
  res.json({ success: true, data: { submission } });
});

const downloadFile = asyncHandler(async (req, res) => {
  const { file, absolutePath } = await submissionService.fileForDownload(
    req.user,
    req.params.id,
    req.params.fileId,
    { admin: req.user.role === 'ADMIN' },
  );

  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Disposition', contentDisposition(file.originalName));
  res.sendFile(absolutePath);
});

const listSubmissions = asyncHandler(async (req, res) => {
  const submissions = await submissionService.listForAdmin();
  res.json({ success: true, data: { submissions } });
});

const getSubmission = asyncHandler(async (req, res) => {
  if (req.user.role === 'ADMIN') {
    const submission = await submissionService.getForAdmin(req.params.id);
    return res.json({ success: true, data: { submission } });
  }
  const submission = await submissionService.getForContributor(req.user, req.params.id);
  res.json({ success: true, data: { submission } });
});

const startReview = asyncHandler(async (req, res) => {
  const submission = await submissionService.startReview(req.user, req.params.id);
  res.json({ success: true, data: { submission } });
});

const reviewSubmission = asyncHandler(async (req, res) => {
  const submission = await submissionService.reviewSubmission(req.user, req.params.id, req.body);
  res.json({ success: true, data: { submission } });
});

const resubmitSubmission = asyncHandler(async (req, res) => {
  const submission = await submissionService.resubmitSubmission(req.user, req.params.id);
  res.json({ success: true, data: { submission } });
});

const markContentReady = asyncHandler(async (req, res) => {
  const submission = await submissionService.markContentReady(req.params.id);
  res.json({ success: true, data: { submission } });
});

const exportSubmission = asyncHandler(async (req, res) => {
  const payload = await submissionService.exportSubmission(req.params.id);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="submission-${payload.submissionId}-v${payload.version}.json"`,
  );
  res.send(JSON.stringify(payload, null, 2));
});

const listContentReady = asyncHandler(async (req, res) => {
  const submissions = await submissionService.listContentReady();
  res.json({ success: true, data: { submissions } });
});

const exportContentReady = asyncHandler(async (req, res) => {
  const payload = await submissionService.exportContentReady();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="content-ready-export.json"');
  res.send(JSON.stringify(payload, null, 2));
});

const createTopicResource = asyncHandler(async (req, res) => {
  const submission = await submissionService.createTopicResourceSubmission(
    req.user,
    req.body,
    req.files || [],
  );
  res.status(201).json({ success: true, data: { submission } });
});

const updateTopicResource = asyncHandler(async (req, res) => {
  const submission = await submissionService.updateTopicResourceSubmission(
    req.user,
    req.params.id,
    req.body,
    req.files || [],
  );
  res.json({ success: true, data: { submission } });
});

const reorderFiles = asyncHandler(async (req, res) => {
  const submission = await submissionService.reorderSubmissionFiles(
    req.user,
    req.params.id,
    req.body.fileIds || [],
  );
  res.json({ success: true, data: { submission } });
});

module.exports = {
  getMySubmission,
  createSubmission,
  createTopicResource,
  updateTopicResource,
  reorderFiles,
  listMySubmissions,
  updateSubmission,
  submitSubmission,
  addFiles,
  removeFile,
  downloadFile,
  listSubmissions,
  getSubmission,
  startReview,
  reviewSubmission,
  resubmitSubmission,
  markContentReady,
  exportSubmission,
  listContentReady,
  exportContentReady,
};
