import type { ExamBlueprint, ExamPartKey } from '../types/examBlueprint';

export const getBlueprintProgress = (blueprint: ExamBlueprint) => {
  const parts = ['mcq', 'tf', 'short'] as const;
  const groups = new Map<string, { contentId: string; count: number; rowId: string }>();
  const totals = { mcq: 0, tf: 0, short: 0 };
  for (const row of blueprint.rows) {
    for (const part of parts) totals[part] += Object.values(row.allocations[part]).reduce((sum, n) => sum + n, 0);
    const count = Object.values(row.allocations.tf).reduce((sum, n) => sum + n, 0);
    if (count) {
      const group = groups.get(row.contentId) || { contentId: row.contentId, count: 0, rowId: row.id };
      group.count += count;
      groups.set(row.contentId, group);
    }
  }
  const incompleteGroups = [...groups.values()].filter(group => group.count % 4 !== 0);
  return {
    incompleteGroups,
    parts: parts.map((part: ExamPartKey) => {
      const target = blueprint.scores[part].questionCount * (part === 'tf' ? 4 : 1);
      const current = totals[part];
      const difference = current - target;
      const state = difference > 0 ? 'excess' : difference < 0 ? 'missing'
        : part === 'tf' && incompleteGroups.length ? 'grouping' : 'ready';
      return { part, current, target, difference, state,
        completeQuestions: part === 'tf' ? [...groups.values()].reduce((sum, group) => sum + Math.floor(group.count / 4), 0) : current };
    }),
  };
};
