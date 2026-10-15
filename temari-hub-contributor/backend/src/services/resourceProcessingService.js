const fs = require('fs/promises');
const path = require('path');
const { execFile } = require('child_process');
const util = require('util');
const execFileAsync = util.promisify(execFile);
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const { createWorker } = require('tesseract.js');
const { resolveKey } = require('./fileStorage');

/**
 * Detect input type from attached files and text content
 */
function detectInputType(files = [], textContent = '') {
  const fileList = Array.isArray(files) ? files : (files && typeof files === 'object' ? [files] : []);
  if (fileList.length > 0) {
    const first = fileList[0];
    const ext = path.extname(first.originalName || '').toLowerCase();
    const mime = first.mimeType || '';

    if (ext === '.pdf' || mime === 'application/pdf') {
      return 'PDF';
    }
    if (ext === '.docx' || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return 'DOCX';
    }
    if (ext === '.doc' || mime === 'application/msword') {
      return 'DOC';
    }
    if (['.jpg', '.jpeg', '.png'].includes(ext) || mime.startsWith('image/')) {
      return 'IMAGE';
    }
  }

  if (textContent && textContent.trim().length > 0) {
    return 'TEXT';
  }

  return 'TEXT';
}

/**
 * Extract text from PDF file
 */
async function extractPdfText(absolutePath) {
  // Strategy 1: System pdftotext (fast and reliable)
  try {
    const { stdout } = await execFileAsync('/usr/bin/pdftotext', ['-layout', absolutePath, '-'], {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 15000,
    });
    if (stdout && stdout.trim().length > 0) {
      return stdout.trim();
    }
  } catch (err) {
    // Fall back to pure JS pdf-parse
  }

  // Strategy 2: pdf-parse
  try {
    const dataBuffer = await fs.readFile(absolutePath);
    const parsed = await pdfParse(dataBuffer);
    if (parsed && parsed.text && parsed.text.trim().length > 0) {
      return parsed.text.trim();
    }
  } catch (err) {
    throw new Error(`Failed to extract PDF text: ${err.message}`);
  }

  return '';
}

/**
 * Extract text from DOCX / DOC file
 */
async function extractDocText(absolutePath, ext) {
  if (ext === '.doc') {
    // Binary .doc format fallback
    return 'Binary .DOC format detected. Original file preserved for manual review. (Consider saving as .docx for automated extraction)';
  }

  try {
    const result = await mammoth.extractRawText({ path: absolutePath });
    return result.value ? result.value.trim() : '';
  } catch (err) {
    throw new Error(`Failed to extract Word document text: ${err.message}`);
  }
}

/**
 * Extract text from an image or multiple images in order
 */
async function extractImageText(fileList) {
  if (!fileList || fileList.length === 0) {
    return '';
  }

  // Sort files by order if present
  const sortedFiles = [...fileList].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const results = [];

  let worker = null;
  try {
    worker = await createWorker('eng');

    for (let i = 0; i < sortedFiles.length; i += 1) {
      const file = sortedFiles[i];
      const absolutePath = resolveKey(file.storageKey);
      if (!absolutePath) {
        throw new Error(`Storage file missing for ${file.originalName}`);
      }

      const ret = await worker.recognize(absolutePath);
      const text = ret.data?.text ? ret.data.text.trim() : '';
      if (sortedFiles.length > 1) {
        results.push(`--- [Image ${i + 1}: ${file.originalName}] ---\n${text}`);
      } else {
        results.push(text);
      }
    }
  } catch (err) {
    throw new Error(`OCR processing error: ${err.message}`);
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {
        // ignore worker cleanup errors
      }
    }
  }

  return results.join('\n\n').trim();
}

/**
 * Normalize and structure the extracted content
 */
function normalizeContent(rawText, metadata = {}) {
  if (!rawText) {
    return '';
  }

  // Normalize line endings
  const rawLines = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n');

  const processedLines = [];
  let prevWasEmpty = false;

  for (let line of rawLines) {
    // Collapse multiple horizontal spaces and trim
    line = line.replace(/[\t ]+/g, ' ').trim();

    if (!line) {
      if (!prevWasEmpty) {
        processedLines.push('');
        prevWasEmpty = true;
      }
      continue;
    }
    prevWasEmpty = false;

    // Detect section/chapter/unit headers and format as markdown headers
    if (/^(Unit\s+\d+|Chapter\s+\d+|Section\s+\d+|Part\s+\d+|Topic\s*:)/i.test(line) && !line.startsWith('#')) {
      processedLines.push(`## ${line}`);
      continue;
    }

    // Standardize bullet points
    if (/^[-•]\s+/.test(line)) {
      processedLines.push(`* ${line.replace(/^[-•]\s+/, '')}`);
      continue;
    }

    processedLines.push(line);
  }

  const cleaned = processedLines.join('\n').trim();

  // Create structured representation with clear topic metadata
  const lines = [];

  if (metadata.resourceName) {
    lines.push(`# ${metadata.resourceName.trim()}`);
  }
  if (metadata.topic) {
    lines.push(`**Topic:** ${metadata.topic.trim()}`);
  }
  if (metadata.subject) {
    lines.push(`**Subject:** ${metadata.subject.trim()}`);
  }
  if (metadata.pageFrom !== null && metadata.pageFrom !== undefined && metadata.pageTo !== null && metadata.pageTo !== undefined) {
    lines.push(`**Pages:** ${metadata.pageFrom} - ${metadata.pageTo}`);
  }
  if (metadata.prerequisites && metadata.prerequisites.length > 0) {
    lines.push(`**Prerequisites:** ${metadata.prerequisites.join(', ')}`);
  }

  if (lines.length > 0) {
    lines.push('---');
  }

  lines.push(cleaned);

  return lines.join('\n\n');
}

/**
 * Process a topic resource submission
 * Returns { inputType, extractedContent, normalizedContent, processingStatus, processingError }
 */
async function processResource({ files = [], rawContent = '', metadata = {} }) {
  const inputType = metadata.inputType || detectInputType(files, rawContent);

  let extractedContent = '';
  let processingStatus = 'PENDING';
  let processingError = '';

  try {
    if (inputType === 'TEXT') {
      extractedContent = (rawContent || '').trim();
      processingStatus = 'PROCESSED';
    } else if (inputType === 'PDF') {
      const file = files[0];
      if (!file) throw new Error('No PDF file provided');
      const absolutePath = resolveKey(file.storageKey);
      if (!absolutePath) throw new Error('File not found in storage');

      extractedContent = await extractPdfText(absolutePath);
      processingStatus = 'PROCESSED';
    } else if (inputType === 'DOC' || inputType === 'DOCX') {
      const file = files[0];
      if (!file) throw new Error('No document file provided');
      const absolutePath = resolveKey(file.storageKey);
      if (!absolutePath) throw new Error('File not found in storage');

      const ext = path.extname(file.originalName || '').toLowerCase();
      extractedContent = await extractDocText(absolutePath, ext);
      processingStatus = 'PROCESSED';
    } else if (inputType === 'IMAGE') {
      if (!files || files.length === 0) throw new Error('No images provided for OCR');
      extractedContent = await extractImageText(files);
      processingStatus = 'PROCESSED';
    } else {
      extractedContent = (rawContent || '').trim();
      processingStatus = 'PROCESSED';
    }
  } catch (err) {
    processingStatus = 'PROCESSING_FAILED';
    processingError = err.message || 'Error occurred during resource processing';
    // Do not throw; we preserve original file and store error
  }

  const normalizedContent = processingStatus === 'PROCESSED'
    ? normalizeContent(extractedContent, { ...metadata, inputType })
    : '';

  return {
    inputType,
    extractedContent,
    normalizedContent,
    processingStatus,
    processingError,
  };
}

module.exports = {
  detectInputType,
  extractPdfText,
  extractDocText,
  extractImageText,
  normalizeContent,
  processResource,
};
