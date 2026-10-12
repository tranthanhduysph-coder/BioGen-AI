import type { ExamBlueprint } from '../types/examBlueprint';
import type { GeneratedExamItem } from '../types/generatedExam';

const DRAFT_KEY = 'biogen_exam_review_draft_v1';

export interface ExamReviewDraft {
  version: 1;
  blueprintSignature: string;
  generatedItems: GeneratedExamItem[];
  approvedSlotIds: string[];
  lockedQuestionIds: string[];
  generationSource: 'ai' | 'mock' | null;
  creditExamId?: string;
  ownerUid?: string;
}

export const getBlueprintSignature = (blueprint: ExamBlueprint) =>
  JSON.stringify({
    grade: blueprint.grade,
    title: blueprint.title,
    durationMinutes: blueprint.durationMinutes,
    scores: blueprint.scores,
    rows: blueprint.rows,
  });

export const loadExamReviewDraft = (blueprint: ExamBlueprint, ownerUid?: string): ExamReviewDraft | null => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as ExamReviewDraft;
    if (
      parsed?.version !== 1 ||
      parsed.blueprintSignature !== getBlueprintSignature(blueprint) ||
      !Array.isArray(parsed.generatedItems)
      || (parsed.ownerUid && parsed.ownerUid !== ownerUid)
    ) {
      return null;
    }

    return {
      version: 1,
      blueprintSignature: parsed.blueprintSignature,
      generatedItems: parsed.generatedItems,
      approvedSlotIds: Array.isArray(parsed.approvedSlotIds) ? parsed.approvedSlotIds : [],
      lockedQuestionIds: Array.isArray(parsed.lockedQuestionIds) ? parsed.lockedQuestionIds : [],
      generationSource: parsed.generationSource ?? null,
      creditExamId: parsed.creditExamId,
      ownerUid: parsed.ownerUid,
    };
  } catch {
    return null;
  }
};

export const saveExamReviewDraft = (
  blueprint: ExamBlueprint,
  generatedItems: GeneratedExamItem[],
  approvedSlotIds: string[],
  lockedQuestionIds: string[],
  generationSource: 'ai' | 'mock' | null,
  creditExamId?: string,
  ownerUid?: string,
) => {
  if (generatedItems.length === 0) {
    localStorage.removeItem(DRAFT_KEY);
    return;
  }

  const draft: ExamReviewDraft = {
    version: 1,
    blueprintSignature: getBlueprintSignature(blueprint),
    generatedItems,
    approvedSlotIds,
    lockedQuestionIds,
    generationSource,
    creditExamId,
    ownerUid: creditExamId ? ownerUid : undefined,
  };

  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
};

export const clearExamReviewDraft = () => {
  localStorage.removeItem(DRAFT_KEY);
};
