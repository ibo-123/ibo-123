import type { DiagnosticSection, RunnerItem } from '../types';

/** Flatten sections into the runner queue (order preserved). */
export function flattenSections(sections: DiagnosticSection[]): RunnerItem[] {
  const items: RunnerItem[] = [];
  let globalIndex = 0;

  for (const section of sections) {
    const sectionCount = section.question_count > 0 ? section.question_count : section.question_ids.length;
    section.question_ids.forEach((questionId, index) => {
      items.push({
        questionId,
        subjectName: section.subject_name,
        indexInSection: index + 1,
        sectionCount,
        globalIndex,
      });
      globalIndex += 1;
    });
  }

  return items;
}
