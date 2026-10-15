const Topic = require('../models/Topic');
const Job = require('../models/Job');

const STANDARD_CURRICULUM = {
  MATHEMATICS: [
    { name: 'Basic Algebra', prerequisites: [] },
    { name: 'Linear Equations', prerequisites: ['Basic Algebra'] },
    { name: 'Factorization', prerequisites: ['Basic Algebra'] },
    {
      name: 'Quadratic Equations',
      prerequisites: ['Basic Algebra', 'Linear Equations', 'Factorization'],
    },
    { name: 'Functions and Graphs', prerequisites: ['Linear Equations'] },
    { name: 'Polynomials', prerequisites: ['Factorization'] },
    { name: 'Trigonometry', prerequisites: ['Functions and Graphs'] },
    { name: 'Differential Calculus', prerequisites: ['Functions and Graphs', 'Trigonometry'] },
    { name: 'Integral Calculus', prerequisites: ['Differential Calculus'] },
    { name: 'Coordinate Geometry', prerequisites: ['Linear Equations'] },
    { name: 'Statistics and Probability', prerequisites: ['Basic Algebra'] },
    { name: 'Vectors and Matrices', prerequisites: ['Linear Equations'] },
  ],
  PHYSICS: [
    { name: 'Units and Measurement', prerequisites: [] },
    { name: 'Kinematics', prerequisites: ['Units and Measurement'] },
    { name: 'Newton\'s Laws of Motion', prerequisites: ['Kinematics'] },
    { name: 'Work, Energy and Power', prerequisites: ['Newton\'s Laws of Motion'] },
    { name: 'Circular Motion and Gravitation', prerequisites: ['Newton\'s Laws of Motion'] },
    { name: 'Thermodynamics', prerequisites: ['Work, Energy and Power'] },
    { name: 'Electrostatics', prerequisites: ['Newton\'s Laws of Motion'] },
    { name: 'Current Electricity', prerequisites: ['Electrostatics'] },
    { name: 'Magnetism and Electromagnetic Induction', prerequisites: ['Current Electricity'] },
    { name: 'Optics and Wave Phenomenon', prerequisites: ['Kinematics'] },
  ],
  CHEMISTRY: [
    { name: 'Atomic Structure and Periodic Table', prerequisites: [] },
    { name: 'Chemical Bonding and Molecular Structure', prerequisites: ['Atomic Structure and Periodic Table'] },
    { name: 'Stoichiometry and Mole Concept', prerequisites: ['Atomic Structure and Periodic Table'] },
    { name: 'States of Matter', prerequisites: ['Atomic Structure and Periodic Table'] },
    { name: 'Chemical Equilibrium', prerequisites: ['Stoichiometry and Mole Concept'] },
    { name: 'Acids, Bases, and Salts', prerequisites: ['Chemical Equilibrium'] },
    { name: 'Electrochemistry', prerequisites: ['Acids, Bases, and Salts'] },
    { name: 'Organic Chemistry Fundamentals', prerequisites: ['Chemical Bonding and Molecular Structure'] },
    { name: 'Hydrocarbons', prerequisites: ['Organic Chemistry Fundamentals'] },
  ],
  BIOLOGY: [
    { name: 'Cell Biology and Cell Division', prerequisites: [] },
    { name: 'Biomolecules and Enzymes', prerequisites: ['Cell Biology and Cell Division'] },
    { name: 'Plant Physiology and Photosynthesis', prerequisites: ['Biomolecules and Enzymes'] },
    { name: 'Human Anatomy and Physiology', prerequisites: ['Cell Biology and Cell Division'] },
    { name: 'Genetics and Heredity', prerequisites: ['Cell Biology and Cell Division'] },
    { name: 'Evolution and Natural Selection', prerequisites: ['Genetics and Heredity'] },
    { name: 'Ecology and Ecosystems', prerequisites: ['Evolution and Natural Selection'] },
  ],
  ENGLISH: [
    { name: 'Parts of Speech and Grammar Rules', prerequisites: [] },
    { name: 'Sentence Structure and Syntax', prerequisites: ['Parts of Speech and Grammar Rules'] },
    { name: 'Reading Comprehension and Critical Analysis', prerequisites: ['Sentence Structure and Syntax'] },
    { name: 'Vocabulary and Context Clues', prerequisites: ['Parts of Speech and Grammar Rules'] },
    { name: 'Essay Writing and Composition', prerequisites: ['Sentence Structure and Syntax'] },
    { name: 'Literature and Figurative Language', prerequisites: ['Reading Comprehension and Critical Analysis'] },
  ],
};

async function ensureSeedTopicsForSubject(subject) {
  const count = await Topic.countDocuments({ subject });
  if (count === 0 && STANDARD_CURRICULUM[subject]) {
    const items = STANDARD_CURRICULUM[subject].map((item) => ({
      subject,
      name: item.name,
      prerequisites: item.prerequisites,
      isCurriculumStandard: true,
    }));
    await Topic.insertMany(items, { ordered: false }).catch(() => {});
  }
}

async function getTopics(subject, query = '') {
  const normalizedSubject = String(subject || '').toUpperCase().trim();
  if (normalizedSubject) {
    await ensureSeedTopicsForSubject(normalizedSubject);
  }

  const filter = {};
  if (normalizedSubject) {
    filter.subject = normalizedSubject;
  }
  if (query && query.trim()) {
    filter.name = { $regex: query.trim(), $options: 'i' };
  }

  const topics = await Topic.find(filter).sort({ name: 1 }).lean();

  // Also include any topic names from existing Jobs if not already present
  if (normalizedSubject) {
    const jobTopics = await Job.distinct('topic', { subject: normalizedSubject });
    const existingNames = new Set(topics.map((t) => t.name.toLowerCase()));
    for (const jobTopic of jobTopics) {
      if (jobTopic && !existingNames.has(jobTopic.toLowerCase())) {
        topics.push({
          subject: normalizedSubject,
          name: jobTopic,
          prerequisites: [],
          isCurriculumStandard: false,
        });
        existingNames.add(jobTopic.toLowerCase());
      }
    }
  }

  return topics.map((t) => ({
    id: t._id ? String(t._id) : t.name,
    name: t.name,
    subject: t.subject,
    prerequisites: t.prerequisites || [],
    isCurriculumStandard: Boolean(t.isCurriculumStandard),
  }));
}

async function upsertTopicPrerequisites(subject, topicName, prerequisites = []) {
  if (!subject || !topicName) return null;
  const normalizedSubject = String(subject).toUpperCase().trim();
  const normalizedTopic = String(topicName).trim();
  const cleanPrereqs = Array.isArray(prerequisites)
    ? [...new Set(prerequisites.map((p) => String(p).trim()).filter(Boolean))]
    : [];

  const updated = await Topic.findOneAndUpdate(
    { subject: normalizedSubject, name: normalizedTopic },
    {
      $set: {
        subject: normalizedSubject,
        name: normalizedTopic,
        prerequisites: cleanPrereqs,
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  return updated;
}

module.exports = {
  STANDARD_CURRICULUM,
  getTopics,
  upsertTopicPrerequisites,
  ensureSeedTopicsForSubject,
};
