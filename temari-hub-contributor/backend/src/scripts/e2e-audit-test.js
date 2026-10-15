const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const BASE_URL = 'http://127.0.0.1:5000/api';

let adminToken = '';
let contributorToken = '';
let adminUser = null;
let contributorUser = null;

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests += 1;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests += 1;
  console.log(`✅ PASS: ${message}`);
}

async function api(endpoint, options = {}, token = '') {
  const headers = { ...(options.headers || {}) };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runAudit() {
  console.log('\n======================================================');
  console.log('STARTING END-TO-END QA & INTEGRATION AUDIT SUITE');
  console.log('======================================================\n');

  // --- 1. Authentication ---
  console.log('\n--- Section 1: Authentication & Role Tokens ---');
  const adminLogin = await api('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
  });
  assert(adminLogin.status === 200 && adminLogin.data.success, 'Admin login succeeds');
  adminToken = adminLogin.data.data.token;
  adminUser = adminLogin.data.data.user;
  assert(adminUser.role === 'ADMIN', 'Admin user has ADMIN role');

  const contribLogin = await api('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.CONTRIBUTOR_EMAIL, password: process.env.CONTRIBUTOR_PASSWORD }),
  });
  assert(contribLogin.status === 200 && contribLogin.data.success, 'Contributor login succeeds');
  contributorToken = contribLogin.data.data.token;
  contributorUser = contribLogin.data.data.user;
  assert(contributorUser.role === 'CONTRIBUTOR', 'Contributor user has CONTRIBUTOR role');

  // --- 2. Topic Search & Prerequisite Selection (Section 7) ---
  console.log('\n--- Section 2: Topic Search & Prerequisite Integrity ---');
  const topicsRes = await api('/topics?subject=MATHEMATICS', {}, contributorToken);
  assert(topicsRes.status === 200 && Array.isArray(topicsRes.data.data.topics), 'Fetch topics by subject');
  const mathTopics = topicsRes.data.data.topics;
  const quadratic = mathTopics.find((t) => t.name === 'Quadratic Equations');
  assert(Boolean(quadratic), 'Mathematics topics contain Quadratic Equations');
  assert(
    quadratic.prerequisites.includes('Basic Algebra') &&
    quadratic.prerequisites.includes('Linear Equations') &&
    quadratic.prerequisites.includes('Factorization'),
    'Quadratic Equations contains standard prerequisites: Basic Algebra, Linear Equations, Factorization',
  );

  // --- 3. Test A: Text Submission (Section 2) ---
  console.log('\n--- Section 3: Topic Resource Test A (Text Submission) ---');
  const formA = new FormData();
  formA.append('subject', 'MATHEMATICS');
  formA.append('topic', 'Quadratic Equations');
  formA.append('resourceName', 'Advanced Algebra Notes');
  formA.append('pageFrom', '35');
  formA.append('pageTo', '48');
  formA.append('prerequisites', JSON.stringify(['Basic Algebra', 'Linear Equations', 'Factorization']));
  formA.append(
    'rawContent',
    'Unit 1: Deriving the Quadratic Formula\n\nFor any equation ax^2 + bx + c = 0, the roots are x = (-b ± √(b^2 - 4ac)) / (2a).\n\n* Discriminant > 0: Two distinct real roots\n* Discriminant = 0: One repeated real root\n* Discriminant < 0: Two complex roots',
  );
  formA.append('notes', 'Direct text submission for Chapter 4 algebra review.');

  const subARes = await api('/submissions/topic-resource', {
    method: 'POST',
    body: formA,
  }, contributorToken);

  assert(subARes.status === 201 && subARes.data.success, 'Direct text resource created (201)');
  const subA = subARes.data.data.submission;
  const subAId = subA.id;
  assert(subA.submissionType === 'TOPIC_RESOURCE', 'Submission type is TOPIC_RESOURCE');
  assert(subA.topicResource.inputType === 'TEXT', 'Input type is TEXT');
  assert(subA.topicResource.processingStatus === 'PROCESSED', 'Processing status is PROCESSED');
  assert(subA.status === 'SUBMITTED', 'Review status is SUBMITTED');
  assert(subA.topicResource.resourceName === 'Advanced Algebra Notes', 'Resource name correctly persisted');
  assert(subA.topicResource.pageFrom === 35 && subA.topicResource.pageTo === 48, 'Pages 35-48 correctly persisted');
  assert(subA.topicResource.normalizedContent.includes('## Unit 1: Deriving the Quadratic Formula'), 'Normalized content converted headers to markdown style');
  assert(subA.topicResource.normalizedContent.includes('* Discriminant > 0: Two distinct real roots'), 'Normalized content contains formatted bullet list');

  // Verify visible to Admin
  const adminGetA = await api(`/submissions/${subAId}`, {}, adminToken);
  assert(adminGetA.status === 200 && adminGetA.data.data.submission.id === subAId, 'Text resource visible to admin');
  assert(adminGetA.data.data.submission.contributor.name === contributorUser.name, 'Admin sees contributor info');

  // --- 4. Test B: Real PDF Upload (Section 3) ---
  console.log('\n--- Section 4: Topic Resource Test B (PDF Document) ---');
  // Generate minimal valid PDF
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 72 >>
stream
BT
/F1 16 Tf
50 700 Td
(Unit 1: Fundamentals of Differential Calculus and Derivatives) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000367 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
443
%%EOF`;

  const pdfBlob = new Blob([pdfContent], { type: 'application/pdf' });
  const formB = new FormData();
  formB.append('subject', 'MATHEMATICS');
  formB.append('topic', 'Differential Calculus');
  formB.append('resourceName', 'Calculus Fundamentals PDF');
  formB.append('pageFrom', '10');
  formB.append('pageTo', '15');
  formB.append('prerequisites', JSON.stringify(['Functions and Graphs', 'Trigonometry']));
  formB.append('files', pdfBlob, 'calculus_lecture.pdf');
  formB.append('notes', 'PDF uploaded material');

  const subBRes = await api('/submissions/topic-resource', {
    method: 'POST',
    body: formB,
  }, contributorToken);

  assert(subBRes.status === 201 && subBRes.data.success, 'PDF submission created successfully');
  const subB = subBRes.data.data.submission;
  const subBId = subB.id;
  assert(subB.topicResource.inputType === 'PDF', 'Detected input type is PDF');
  assert(subB.topicResource.processingStatus === 'PROCESSED', 'PDF processingStatus is PROCESSED');
  assert(subB.files.length === 1, 'One PDF file saved on submission');
  const pdfFileId = subB.files[0].id;

  // Admin download original PDF file
  const downloadRes = await fetch(`${BASE_URL}/submissions/${subBId}/files/${pdfFileId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(downloadRes.status === 200, 'Admin can download original PDF file');
  const downloadedText = await downloadRes.text();
  assert(downloadedText.includes('%PDF-1.4'), 'Downloaded file content matches original PDF');

  // --- 5. Test C: Real DOCX Upload (Section 4) ---
  console.log('\n--- Section 5: Topic Resource Test C (DOCX Document) ---');
  execSync(`python3 -c "
import zipfile, io
buf = io.BytesIO()
with zipfile.ZipFile(buf, 'w') as z:
    z.writestr('[Content_Types].xml', '''<?xml version=\\"1.0\\" encoding=\\"UTF-8\\" standalone=\\"yes\\"?>
<Types xmlns=\\"http://schemas.openxmlformats.org/package/2006/content-types\\">
  <Default Extension=\\"rels\\" ContentType=\\"application/vnd.openxmlformats-package.relationships+xml\\"/>
  <Default Extension=\\"xml\\" ContentType=\\"application/xml\\"/>
  <Override PartName=\\"/word/document.xml\\" ContentType=\\"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml\\"/>
</Types>''')
    z.writestr('_rels/.rels', '''<?xml version=\\"1.0\\" encoding=\\"UTF-8\\" standalone=\\"yes\\"?>
<Relationships xmlns=\\"http://schemas.openxmlformats.org/package/2006/relationships\\">
  <Relationship Id=\\"rId1\\" Type=\\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\\" Target=\\"word/document.xml\\"/>
</Relationships>''')
    z.writestr('word/document.xml', '''<?xml version=\\"1.0\\" encoding=\\"UTF-8\\" standalone=\\"yes\\"?>
<w:document xmlns:w=\\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\\">
  <w:body>
    <w:p><w:r><w:t>Unit 2: Kinematics and Motion Dynamics</w:t></w:r></w:p>
    <w:p><w:r><w:t>- Velocity is the rate of change of displacement.</w:t></w:r></w:p>
    <w:p><w:r><w:t>- Acceleration is the rate of change of velocity.</w:t></w:r></w:p>
  </w:body>
</w:document>''')
with open('/tmp/test_upload.docx', 'wb') as f:
    f.write(buf.getvalue())
"`);

  const docxBuffer = fs.readFileSync('/tmp/test_upload.docx');
  const docxBlob = new Blob([docxBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  const formC = new FormData();
  formC.append('subject', 'PHYSICS');
  formC.append('topic', 'Kinematics');
  formC.append('resourceName', 'Kinematics Study Guide');
  formC.append('pageFrom', '1');
  formC.append('pageTo', '8');
  formC.append('prerequisites', JSON.stringify(['Units and Measurement']));
  formC.append('files', docxBlob, 'kinematics_guide.docx');

  const subCRes = await api('/submissions/topic-resource', {
    method: 'POST',
    body: formC,
  }, contributorToken);

  assert(subCRes.status === 201 && subCRes.data.success, 'DOCX submission created successfully');
  const subC = subCRes.data.data.submission;
  assert(subC.topicResource.inputType === 'DOCX', 'Detected input type is DOCX');
  assert(subC.topicResource.processingStatus === 'PROCESSED', 'DOCX processingStatus is PROCESSED');
  assert(subC.topicResource.extractedContent.includes('Kinematics and Motion Dynamics'), 'Extracted content contains document text');
  assert(subC.topicResource.normalizedContent.includes('## Unit 2: Kinematics and Motion Dynamics'), 'Normalized content formats headers');

  // --- 6. Test D: Image OCR Upload & Reordering (Section 5) ---
  console.log('\n--- Section 6: Topic Resource Test D (Multi-Image OCR & Reordering) ---');
  execSync(`python3 -c "
from PIL import Image, ImageDraw
for i, txt in enumerate(['PAGE ONE: CELL STRUCTURE', 'PAGE TWO: PHOTOSYNTHESIS'], 1):
    img = Image.new('RGB', (450, 100), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((20, 40), txt, fill=(0, 0, 0))
    img.save(f'/tmp/ocr_page{i}.png')
"`);

  const img1Buf = fs.readFileSync('/tmp/ocr_page1.png');
  const img2Buf = fs.readFileSync('/tmp/ocr_page2.png');
  const img1Blob = new Blob([img1Buf], { type: 'image/png' });
  const img2Blob = new Blob([img2Buf], { type: 'image/png' });

  const formD = new FormData();
  formD.append('subject', 'BIOLOGY');
  formD.append('topic', 'Cell Biology');
  formD.append('resourceName', 'Cell Biology Handout');
  formD.append('pageFrom', '1');
  formD.append('pageTo', '2');
  formD.append('files', img1Blob, 'ocr_page1.png');
  formD.append('files', img2Blob, 'ocr_page2.png');

  const subDRes = await api('/submissions/topic-resource', {
    method: 'POST',
    body: formD,
  }, contributorToken);

  assert(subDRes.status === 201 && subDRes.data.success, 'Multi-image submission created successfully');
  const subD = subDRes.data.data.submission;
  const subDId = subD.id;
  assert(subD.topicResource.inputType === 'IMAGE', 'Input type is IMAGE');
  assert(subD.topicResource.processingStatus === 'PROCESSED', 'Image OCR processing status is PROCESSED');
  assert(subD.files.length === 2, 'Two image files saved');

  // Verify that reordering when SUBMITTED is blocked by assertEditable (409)
  const originalFileIds = subD.files.map((f) => f.id);
  const reversedFileIds = [originalFileIds[1], originalFileIds[0]];
  const blockedReorder = await api(`/submissions/${subDId}/reorder-files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileIds: reversedFileIds }),
  }, contributorToken);
  assert(blockedReorder.status === 409, 'Reordering files while in review is blocked (409 Conflict)');

  // Admin requests revision to reorder pages
  await api(`/submissions/${subDId}/review/start`, { method: 'POST' }, adminToken);
  await api(`/submissions/${subDId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision: 'REVISION_REQUIRED', feedback: 'Please reorder pages in chronological order' }),
  }, adminToken);

  // Now contributor reorders files during revision
  const reorderRes = await api(`/submissions/${subDId}/reorder-files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileIds: reversedFileIds }),
  }, contributorToken);

  assert(reorderRes.status === 200 && reorderRes.data.success, 'File reordering request succeeds in revision');
  const reorderedSub = reorderRes.data.data.submission;
  assert(reorderedSub.files[0].id === reversedFileIds[0], 'First file is now the formerly second file');
  assert(reorderedSub.files[1].id === reversedFileIds[1], 'Second file is now the formerly first file');

  // --- 7. Test E: Processing Failure Handling (Section 6) ---
  console.log('\n--- Section 7: Processing Failure Handling & File Preservation ---');
  // Create a corrupted "PDF" file that will fail pdf parsing/pdftotext
  const corruptedBlob = new Blob(['Not a real PDF header at all. Random corrupted binary junk \x00\xff\xfe\xca\xfe\xba\xbe'], {
    type: 'application/pdf',
  });
  const formE = new FormData();
  formE.append('subject', 'CHEMISTRY');
  formE.append('topic', 'States of Matter');
  formE.append('resourceName', 'Corrupted PDF Test');
  formE.append('pageFrom', '1');
  formE.append('pageTo', '3');
  formE.append('files', corruptedBlob, 'corrupted_sample.pdf');

  const subERes = await api('/submissions/topic-resource', {
    method: 'POST',
    body: formE,
  }, contributorToken);

  assert(subERes.status === 201, 'Corrupted file submission is accepted without throwing 500');
  const subE = subERes.data.data.submission;
  const subEId = subE.id;
  assert(subE.topicResource.processingStatus === 'PROCESSING_FAILED', 'Processing status correctly marked PROCESSING_FAILED');
  assert(Boolean(subE.topicResource.processingError), 'Useful processingError message is recorded');
  assert(subE.files.length === 1, 'Original corrupted file is safely preserved in DB');

  // Verify Admin can still view and download the preserved file
  const adminGetE = await api(`/submissions/${subEId}`, {}, adminToken);
  assert(adminGetE.status === 200, 'Admin can view submission with failed processing');
  const fileEId = subE.files[0].id;
  const adminDownloadE = await fetch(`${BASE_URL}/submissions/${subEId}/files/${fileEId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(adminDownloadE.status === 200, 'Admin can download preserved file even when text extraction failed');

  // --- 8. Test F: Full Revision Workflow (Section 8) ---
  console.log('\n--- Section 8: Revision Workflow ---');
  // Admin starts review on subA (Advanced Algebra Notes)
  const startRevRes = await api(`/submissions/${subAId}/review/start`, { method: 'POST' }, adminToken);
  assert(startRevRes.status === 200, 'Admin starts review');
  assert(startRevRes.data.data.submission.status === 'UNDER_REVIEW', 'Status transitions to UNDER_REVIEW');

  // Admin requests revision
  const reqRevRes = await api(`/submissions/${subAId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      decision: 'REVISION_REQUIRED',
      feedback: 'Please expand on the complex conjugate roots and update page interval to 35-50.',
    }),
  }, adminToken);
  assert(reqRevRes.status === 200, 'Admin requests revision with mandatory feedback');
  assert(reqRevRes.data.data.submission.status === 'REVISION_REQUIRED', 'Status transitions to REVISION_REQUIRED');

  // Contributor checks submission and sees feedback
  const contribCheckA = await api(`/submissions/${subAId}`, {}, contributorToken);
  assert(contribCheckA.status === 200, 'Contributor loads submission');
  const latestReview = contribCheckA.data.data.submission.reviews.slice(-1)[0];
  assert(latestReview.decision === 'REVISION_REQUIRED', 'Contributor sees REVISION_REQUIRED decision');
  assert(latestReview.feedback.includes('complex conjugate roots'), 'Contributor sees reviewer feedback');

  // Contributor updates topic resource and resubmits
  const updateFormA = new FormData();
  updateFormA.append('subject', 'MATHEMATICS');
  updateFormA.append('topic', 'Quadratic Equations');
  updateFormA.append('resourceName', 'Advanced Algebra Notes (Revised)');
  updateFormA.append('pageFrom', '35');
  updateFormA.append('pageTo', '50');
  updateFormA.append('prerequisites', JSON.stringify(['Basic Algebra', 'Linear Equations', 'Factorization']));
  updateFormA.append(
    'rawContent',
    'Unit 1: Deriving the Quadratic Formula\n\nFor any equation ax^2 + bx + c = 0, the roots are x = (-b ± √(b^2 - 4ac)) / (2a).\n\n* Discriminant > 0: Two distinct real roots\n* Discriminant = 0: One repeated real root\n* Discriminant < 0: Two complex conjugate roots (a ± bi)',
  );
  updateFormA.append('notes', 'Revised with complex conjugate roots and pages updated.');
  updateFormA.append('submitNow', 'true');

  const updateSubRes = await api(`/submissions/${subAId}/topic-resource`, {
    method: 'PUT',
    body: updateFormA,
  }, contributorToken);

  assert(updateSubRes.status === 200 && updateSubRes.data.success, 'Contributor resubmits revised resource');
  const updatedSubA = updateSubRes.data.data.submission;
  assert(updatedSubA.status === 'SUBMITTED', 'Status returns to SUBMITTED');
  assert(updatedSubA.currentVersion === 2, 'Version bumped to 2');
  assert(updatedSubA.versions.length >= 2, 'Previous version 1 preserved in version history');
  assert(updatedSubA.topicResource.pageTo === 50, 'Updated metadata pageTo = 50');

  // --- 9. Test G: Approval & Content Ready Workflow (Section 9) ---
  console.log('\n--- Section 9: Approval & Content Ready Workflow ---');
  // Admin reviews again and approves
  const approveRes = await api(`/submissions/${subAId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision: 'APPROVED', feedback: 'Looks excellent now. Approved!' }),
  }, adminToken);

  assert(approveRes.status === 200, 'Admin approves submission');
  const approvedSubA = approveRes.data.data.submission;
  assert(approvedSubA.status === 'APPROVED', 'Status transitions to APPROVED');
  assert(approvedSubA.approvedVersion === 2, 'Approved version is set to version 2');

  // Admin marks content ready
  const readyRes = await api(`/submissions/${subAId}/content-ready`, { method: 'POST' }, adminToken);
  assert(readyRes.status === 200, 'Admin marks submission content ready');
  const readySubA = readyRes.data.data.submission;
  assert(readySubA.status === 'CONTENT_READY', 'Status transitions to CONTENT_READY');
  assert(Boolean(readySubA.contentReadyAt), 'contentReadyAt timestamp recorded');

  // Admin exports submission
  const exportRes = await api(`/submissions/${subAId}/export`, {}, adminToken);
  assert(exportRes.status === 200, 'Admin exports content ready submission');
  const exportPayload = exportRes.data;
  assert(exportPayload.purpose === 'ethio-exam-platform-handoff', 'Export payload has platform purpose');
  assert(exportPayload.submissionType === 'TOPIC_RESOURCE', 'Export payload identifies submissionType');
  assert(exportPayload.topicResource.resourceName === 'Advanced Algebra Notes (Revised)', 'Export contains approved resource');

  // --- 10. Test H: Rejection Workflow (Section 10) ---
  console.log('\n--- Section 10: Rejection Workflow ---');
  // Use subC for rejection test
  // Try to reject without feedback -> Expect 400
  const badReject = await api(`/submissions/${subC.id}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision: 'REJECTED', feedback: '' }),
  }, adminToken);
  assert(badReject.status === 400, 'Rejection without feedback is rejected with 400');

  // Reject with feedback
  const goodReject = await api(`/submissions/${subC.id}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision: 'REJECTED', feedback: 'Content duplicates an already approved curriculum module.' }),
  }, adminToken);
  assert(goodReject.status === 200, 'Rejection with feedback succeeds');
  const rejectedSubC = goodReject.data.data.submission;
  assert(rejectedSubC.status === 'REJECTED', 'Status is REJECTED');

  // Contributor views rejection reason
  const contribViewRejected = await api(`/submissions/${subC.id}`, {}, contributorToken);
  assert(contribViewRejected.status === 200, 'Contributor can view rejected submission');
  const rejectReview = contribViewRejected.data.data.submission.reviews.slice(-1)[0];
  assert(rejectReview.decision === 'REJECTED', 'Contributor sees REJECTED decision');
  assert(rejectReview.feedback.includes('duplicates an already approved'), 'Contributor sees rejection reason');

  // --- 11. Test I: File Security & Role Authorization (Sections 11 & 12) ---
  console.log('\n--- Section 11: File Security & Role Authorization ---');
  // Disallowed extension
  const evilBlob = new Blob(['malicious executable'], { type: 'application/x-msdownload' });
  const formEvil = new FormData();
  formEvil.append('subject', 'ENGLISH');
  formEvil.append('topic', 'Reading Comprehension');
  formEvil.append('resourceName', 'Executable Test');
  formEvil.append('pageFrom', '1');
  formEvil.append('pageTo', '1');
  formEvil.append('files', evilBlob, 'malware.exe');

  const evilRes = await api('/submissions/topic-resource', {
    method: 'POST',
    body: formEvil,
  }, contributorToken);
  assert(evilRes.status === 400, 'Disallowed file extension .exe is rejected with 400');

  // Contributor tries to approve a submission
  const unauthorizedApprove = await api(`/submissions/${subBId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision: 'APPROVED' }),
  }, contributorToken);
  assert(unauthorizedApprove.status === 403, 'Contributor cannot approve submissions (403 Forbidden)');

  // Contributor tries to mark content ready
  const unauthorizedReady = await api(`/submissions/${subBId}/content-ready`, {
    method: 'POST',
  }, contributorToken);
  assert(unauthorizedReady.status === 403, 'Contributor cannot mark content ready (403 Forbidden)');

  // Contributor tries to access admin-only list submissions
  const unauthorizedList = await api('/submissions', {}, contributorToken);
  assert(unauthorizedList.status === 403, 'Contributor cannot access admin /submissions list (403 Forbidden)');

  // --- 12. Test J: Regression Testing: Template Question Job (Section 19) ---
  console.log('\n--- Section 12: Regression Testing (Template Job Workflow) ---');
  const myJobsRes = await api('/contributor/jobs', {}, contributorToken);
  assert(myJobsRes.status === 200, 'Contributor can fetch assigned jobs');
  const jobs = myJobsRes.data.data.jobs;
  assert(Array.isArray(jobs), 'Assigned jobs is an array');

  if (jobs.length > 0) {
    const job = jobs[0];
    const subForJob = await api(`/contributor/jobs/${job.id}/submission`, {}, contributorToken);
    assert(subForJob.status === 200, 'Fetch submission for template job');
  }

  console.log('\n======================================================');
  console.log(`ALL AUDIT TESTS COMPLETED: ${passedTests}/${totalTests} PASSED`);
  console.log('======================================================\n');
}

runAudit()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('\nAudit run halted due to failure:', err);
    process.exit(1);
  });
