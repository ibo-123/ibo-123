const AuditLog = require("../models/AuditLog");

const record = (data) => AuditLog.create(data).catch((error) => {
  console.error("Audit log error:", error.message);
});

module.exports = { record };
