// backend/src/services/standingsService.js
const Result = require("../models/Result");
const Participant = require("../models/Participant");
const VideoSubmission = require("../models/VideoSubmission");
const Contest = require("../models/Contest");

const REQUIRE_APPROVED_VIDEO = false;
const DEBUG = true;

const log = (...args) => {
  if (DEBUG) console.log("[standings]", ...args);
};