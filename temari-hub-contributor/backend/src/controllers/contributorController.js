const asyncHandler = require('../utils/asyncHandler');
const contributorService = require('../services/contributorService');

const listContributors = asyncHandler(async (req, res) => {
  const contributors = await contributorService.listContributors();

  res.json({
    success: true,
    data: { contributors },
  });
});

const getContributor = asyncHandler(async (req, res) => {
  const contributor = await contributorService.getContributor(req.params.id);

  res.json({
    success: true,
    data: { contributor },
  });
});

const createContributor = asyncHandler(async (req, res) => {
  const contributor = await contributorService.createContributor(req.body, req.user);

  res.status(201).json({
    success: true,
    data: { contributor },
  });
});

const updateContributor = asyncHandler(async (req, res) => {
  const contributor = await contributorService.updateContributor(req.params.id, req.body, req.user);

  res.json({
    success: true,
    data: { contributor },
  });
});

const updateContributorStatus = asyncHandler(async (req, res) => {
  const contributor = await contributorService.updateStatus(req.params.id, req.body?.isActive, req.user);

  res.json({
    success: true,
    data: { contributor },
  });
});

const updateContributorVerification = asyncHandler(async (req, res) => {
  const contributor = await contributorService.updateVerification(
    req.params.id,
    req.body?.academicVerificationStatus,
  );

  res.json({
    success: true,
    data: { contributor },
  });
});

module.exports = {
  listContributors,
  getContributor,
  createContributor,
  updateContributor,
  updateContributorStatus,
  updateContributorVerification,
};
