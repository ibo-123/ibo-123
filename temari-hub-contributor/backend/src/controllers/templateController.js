const asyncHandler = require('../utils/asyncHandler');
const templateService = require('../services/templateService');

const listTemplates = asyncHandler(async (req, res) => {
  const templates = await templateService.listTemplates();
  res.json({ success: true, data: { templates } });
});

const getTemplate = asyncHandler(async (req, res) => {
  const template = await templateService.getTemplate(req.params.id);
  res.json({ success: true, data: { template } });
});

const createTemplate = asyncHandler(async (req, res) => {
  const template = await templateService.createTemplate(req.body, req.user);
  res.status(201).json({ success: true, data: { template } });
});

const updateTemplate = asyncHandler(async (req, res) => {
  const template = await templateService.updateTemplate(req.params.id, req.body);
  res.json({ success: true, data: { template } });
});

const updateTemplateStatus = asyncHandler(async (req, res) => {
  const template = await templateService.updateTemplateStatus(req.params.id, req.body?.isActive);
  res.json({ success: true, data: { template } });
});

module.exports = {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  updateTemplateStatus,
};
