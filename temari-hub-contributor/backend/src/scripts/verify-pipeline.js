const { detectInputType, normalizeContent } = require('../services/resourceProcessingService');
const topicService = require('../services/topicService');

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

async function runTests() {
  console.log('--- Testing Resource Processing Pipeline ---');

  // Test detectInputType
  assert(detectInputType([{ originalName: 'document.pdf', mimeType: 'application/pdf' }]) === 'PDF', 'Detects PDF');
  assert(detectInputType([{ originalName: 'notes.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }]) === 'DOCX', 'Detects DOCX');
  assert(detectInputType([{ originalName: 'notes.doc', mimeType: 'application/msword' }]) === 'DOC', 'Detects DOC');
  assert(detectInputType([{ originalName: 'diagram.png', mimeType: 'image/png' }]) === 'IMAGE', 'Detects PNG Image');
  assert(detectInputType([{ originalName: 'scan.jpg', mimeType: 'image/jpeg' }]) === 'IMAGE', 'Detects JPEG Image');
  assert(detectInputType([], 'Some typed learning resource content') === 'TEXT', 'Detects Text');

  // Test normalizeContent
  const messyText = `
    Unit  1:    Introduction to Calculus  \r\n\r\n\r\n
    Calculus is the mathematical   study of continuous change.   
    \t*   Item   one
    \t-   Item   two
    \t1.   Numbered  item
    
    
    Summary:
    Integrals and derivatives form the fundamental theorem.
  `;

  const normalized = normalizeContent(messyText);
  assert(normalized.includes('## Unit 1: Introduction to Calculus'), 'Converts section headers to markdown style');
  assert(normalized.includes('* Item one'), 'Normalizes bullet points');
  assert(normalized.includes('* Item two'), 'Normalizes dash points to asterisk bullets');
  assert(normalized.includes('1. Numbered item'), 'Normalizes numbered items');
  assert(!normalized.includes('   '), 'Removes repeated spaces');
  assert(!normalized.includes('\n\n\n'), 'Collapses excess blank lines');

  console.log('--- Testing Curriculum Topics ---');
  const mathTopics = topicService.STANDARD_CURRICULUM.MATHEMATICS;
  assert(Array.isArray(mathTopics) && mathTopics.length > 0, 'Math curriculum topics defined');
  const physicsTopics = topicService.STANDARD_CURRICULUM.PHYSICS;
  assert(Array.isArray(physicsTopics) && physicsTopics.length > 0, 'Physics curriculum topics defined');
  const chemTopics = topicService.STANDARD_CURRICULUM.CHEMISTRY;
  assert(Array.isArray(chemTopics) && chemTopics.length > 0, 'Chemistry curriculum topics defined');
  const bioTopics = topicService.STANDARD_CURRICULUM.BIOLOGY;
  assert(Array.isArray(bioTopics) && bioTopics.length > 0, 'Biology curriculum topics defined');
  const engTopics = topicService.STANDARD_CURRICULUM.ENGLISH;
  assert(Array.isArray(engTopics) && engTopics.length > 0, 'English curriculum topics defined');

  // Check calculus prerequisites
  const calculus = mathTopics.find((t) => t.name.includes('Calculus'));
  assert(calculus && calculus.prerequisites.length > 0, 'Calculus has standard prerequisites');
  console.log(`Calculus Prerequisites: ${calculus.prerequisites.join(', ')}`);

  console.log('--- Verifying Server Routes & App Setup ---');
  const app = require('../app');
  assert(typeof app === 'function', 'Express app loads successfully without syntax errors');

  console.log('\nAll pipeline and backend verification checks passed successfully!');
}

runTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
