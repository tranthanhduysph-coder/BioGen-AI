import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createDefaultBlueprint as defaultBlueprint, createBlueprintFromPreset, getBlueprintPresetsForGrade } from '../../data/examBlueprintPresets';
import { getSpecificationSourceLabel, getSpecificationSourceUrl } from '../../data/biologySpecification/catalog';
import { SpecificationCatalog } from './SpecificationCatalog';
import {
  getCompetenciesForContent,
  getContentsForGrade,
  getOutcomeById,
  getOutcomesForSelection,
} from '../../data/biologySpecification';
import {
  emptyBlueprintAllocations,
  type BlueprintRow,
  type CognitiveLevel,
  type ExamBlueprint,
  type ExamPartKey,
} from '../../types/examBlueprint';
import { useTranslation } from 'react-i18next';
import { buildExamSlots, validateExamSlots } from '../../services/examBlueprintService';
import type { ExamSlotPackage } from '../../types/examSlots';
import { generateExamFromSlots, generateExamItem, generateExamItems } from '../../services/examGenerationService';
import type { GeneratedExamItem, GenerationFailure, GenerationProgress } from '../../types/generatedExam';
import { exportExamPackageDocx } from '../../services/examPackageDocxService';
import { getTrueFalseEarnedScore } from '../../services/examScoringService';
import { generateMockExamFromSlots } from '../../services/examMockService';
import { exportMixReadyExamDocx } from '../../services/examMixDocxService';
import { validateMixReadyExam } from '../../services/examMixValidationService';
import {
  clearExamReviewDraft,
  loadExamReviewDraft,
  saveExamReviewDraft,
} from '../../services/examDraftService';
import {
  getExamBackendHealth,
  type ExamBackendHealth,
} from '../../services/examBackendService';

const STORAGE_KEY = 'biogen_exam_blueprint_v1';

const LEVELS: { key: CognitiveLevel; vi: string; en: string }[] = [
  { key: 'know', vi: 'Biết', en: 'Know' },
  { key: 'understand', vi: 'Hiểu', en: 'Understand' },
  { key: 'apply', vi: 'VD', en: 'Apply' },
];

const PARTS: { key: ExamPartKey; vi: string; en: string }[] = [
  { key: 'mcq', vi: 'Phần I · MCQ', en: 'Part I · MCQ' },
  { key: 'tf', vi: 'Phần II · Đ/S', en: 'Part II · T/F' },
  { key: 'short', vi: 'Phần III · TL ngắn', en: 'Part III · Short' },
];

const round = (value: number, digits = 2) => Number(value.toFixed(digits));
const safeNumber = (value: string | number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

const getDefaultRow = (grade: 10 | 11 | 12): BlueprintRow => {
  const contents = getContentsForGrade(grade);
  const contentId = contents[0]?.id || '';
  const competencyCode = getCompetenciesForContent(grade, contentId)[0]?.code || '';
  const outcomeId = getOutcomesForSelection(grade, contentId, competencyCode)[0]?.id || '';
  return {
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    contentId,
    competencyCode,
    outcomeId,
    allocations: emptyBlueprintAllocations(),
  };
};

const NumericInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  className?: string;
}> = ({ value, onChange, step = 1, min = 0, className = '' }) => (
  <input
    type="number"
    min={min}
    step={step}
    value={value}
    onChange={(event) => onChange(safeNumber(event.target.value))}
    className={`w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-sky-900/40 ${className}`}
  />
);

export const ExamBlueprintBuilder: React.FC = () => {
  const { i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';
  const [presetId, setPresetId] = useState('');
  const [blueprint, setBlueprint] = useState<ExamBlueprint>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return defaultBlueprint();

      const parsed = JSON.parse(saved) as ExamBlueprint;
      const levels = parsed?.scores?.tf?.scoreLevels;

      // Migrate preview data from the old absolute/fraction format
      // (0.10, 0.25, 0.50, 1.00) to percentage format
      // (10, 25, 50, 100) without losing the user's blueprint.
      if (levels && Math.max(levels.correct1, levels.correct2, levels.correct3, levels.correct4) <= 1) {
        parsed.scores.tf.scoreLevels = {
          correct1: levels.correct1 * 100,
          correct2: levels.correct2 * 100,
          correct3: levels.correct3 * 100,
          correct4: levels.correct4 * 100,
        };
      }

      return parsed;
    } catch {
      return defaultBlueprint();
    }
  });

  const initialBlueprintEffect = useRef(true);
  const [recoverableDraft, setRecoverableDraft] = useState(() => loadExamReviewDraft(blueprint));

  const [lockedSlots, setLockedSlots] = useState<ExamSlotPackage | null>(null);
  const [slotIssues, setSlotIssues] = useState<string[]>([]);
  const [generatedItems, setGeneratedItems] = useState<GeneratedExamItem[]>([]);
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({ completed: 0, total: 0 });
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationFailures, setGenerationFailures] = useState<GenerationFailure[]>([]);
  const [regeneratingSlotId, setRegeneratingSlotId] = useState<string | null>(null);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [approvedSlotIds, setApprovedSlotIds] = useState<string[]>([]);
  const [lockedQuestionIds, setLockedQuestionIds] = useState<string[]>([]);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [generationSource, setGenerationSource] = useState<'ai' | 'mock' | null>(null);
  const [backendHealth, setBackendHealth] = useState<ExamBackendHealth | null>(null);
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);
  const isBlueprintPreview = window.location.hostname === 'biogenai-blueprint-preview.onrender.com';

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blueprint));

    if (initialBlueprintEffect.current) {
      initialBlueprintEffect.current = false;
      return;
    }

    clearExamReviewDraft();
    setRecoverableDraft(null);
    setLockedSlots(null);
    setSlotIssues([]);
    setGeneratedItems([]);
    setGenerationError(null);
    setGenerationFailures([]);
    setGenerationProgress({ completed: 0, total: 0 });
    setApprovedSlotIds([]);
    setLockedQuestionIds([]);
    setEditingSlotId(null);
    setGenerationSource(null);
  }, [blueprint]);

  useEffect(() => {
    if (generatedItems.length === 0) return;

    saveExamReviewDraft(
      blueprint,
      generatedItems,
      approvedSlotIds,
      lockedQuestionIds,
      generationSource,
    );
  }, [
    blueprint,
    generatedItems,
    approvedSlotIds,
    lockedQuestionIds,
    generationSource,
  ]);

  const refreshBackendHealth = async () => {
    setIsCheckingBackend(true);
    const health = await getExamBackendHealth();
    setBackendHealth(health);
    setIsCheckingBackend(false);
  };

  useEffect(() => {
    refreshBackendHealth();
  }, []);

  const changeGrade = (grade: 10 | 11 | 12) => {
    setPresetId('');
    setBlueprint((current) => ({
      ...current,
      grade,
      rows: [],
    }));
  };

  const updateScorePart = (
    part: ExamPartKey,
    field: 'questionCount' | 'totalScore',
    value: number,
  ) => {
    setBlueprint((current) => ({
      ...current,
      scores: {
        ...current.scores,
        [part]: {
          ...current.scores[part],
          [field]: value,
        },
      },
    }));
  };

  const updateTfLevel = (field: 'correct1' | 'correct2' | 'correct3' | 'correct4', value: number) => {
    setBlueprint((current) => ({
      ...current,
      scores: {
        ...current.scores,
        tf: {
          ...current.scores.tf,
          scoreLevels: {
            ...current.scores.tf.scoreLevels,
            [field]: value,
          },
        },
      },
    }));
  };

  const updateRow = (rowId: string, patch: Partial<BlueprintRow>) => {
    setBlueprint((current) => ({
      ...current,
      rows: current.rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
    }));
  };

  const updateRowSelection = (
    row: BlueprintRow,
    field: 'contentId' | 'competencyCode' | 'outcomeId',
    value: string,
  ) => {
    if (field === 'contentId') {
      const nextCompetency = getCompetenciesForContent(blueprint.grade, value)[0]?.code || '';
      const nextOutcome = getOutcomesForSelection(blueprint.grade, value, nextCompetency)[0]?.id || '';
      updateRow(row.id, {
        contentId: value,
        competencyCode: nextCompetency,
        outcomeId: nextOutcome,
      });
      return;
    }

    if (field === 'competencyCode') {
      const nextOutcome = getOutcomesForSelection(blueprint.grade, row.contentId, value)[0]?.id || '';
      updateRow(row.id, { competencyCode: value, outcomeId: nextOutcome });
      return;
    }

    updateRow(row.id, { outcomeId: value });
  };

  const updateAllocation = (
    row: BlueprintRow,
    part: ExamPartKey,
    level: CognitiveLevel,
    value: number,
  ) => {
    updateRow(row.id, {
      allocations: {
        ...row.allocations,
        [part]: {
          ...row.allocations[part],
          [level]: Math.floor(value),
        },
      },
    });
  };

  const totals = useMemo(() => {
    const result = {
      mcq: { know: 0, understand: 0, apply: 0 },
      tf: { know: 0, understand: 0, apply: 0 },
      short: { know: 0, understand: 0, apply: 0 },
    };

    blueprint.rows.forEach((row) => {
      PARTS.forEach(({ key }) => {
        LEVELS.forEach(({ key: level }) => {
          result[key][level] += row.allocations[key][level] || 0;
        });
      });
    });

    return result;
  }, [blueprint.rows]);

  const partTotals = useMemo(() => ({
    mcq: totals.mcq.know + totals.mcq.understand + totals.mcq.apply,
    tf: totals.tf.know + totals.tf.understand + totals.tf.apply,
    short: totals.short.know + totals.short.understand + totals.short.apply,
  }), [totals]);

  const cognitiveTotals = useMemo(() => ({
    know: totals.mcq.know + totals.tf.know + totals.short.know,
    understand: totals.mcq.understand + totals.tf.understand + totals.short.understand,
    apply: totals.mcq.apply + totals.tf.apply + totals.short.apply,
  }), [totals]);

  const mixValidation = useMemo(
    () => validateMixReadyExam(generatedItems),
    [generatedItems],
  );

  const expectedGeneratedCount =
    blueprint.scores.mcq.questionCount +
    blueprint.scores.tf.questionCount +
    blueprint.scores.short.questionCount;

  const missingQuestionCount = Math.max(0, expectedGeneratedCount - generatedItems.length);

  const allQuestionsGenerated =
    expectedGeneratedCount > 0 &&
    generatedItems.length === expectedGeneratedCount;

  const allQuestionsApproved =
    allQuestionsGenerated &&
    approvedSlotIds.length === expectedGeneratedCount;

  const mixerExportReady =
    allQuestionsGenerated &&
    mixValidation.valid &&
    allQuestionsApproved;

  const totalScore =
    blueprint.scores.mcq.totalScore +
    blueprint.scores.tf.totalScore +
    blueprint.scores.short.totalScore;

  const perQuestion = {
    mcq: blueprint.scores.mcq.questionCount > 0
      ? blueprint.scores.mcq.totalScore / blueprint.scores.mcq.questionCount
      : 0,
    tf: blueprint.scores.tf.questionCount > 0
      ? blueprint.scores.tf.totalScore / blueprint.scores.tf.questionCount
      : 0,
    short: blueprint.scores.short.questionCount > 0
      ? blueprint.scores.short.totalScore / blueprint.scores.short.questionCount
      : 0,
  };

  const targets = {
    mcq: blueprint.scores.mcq.questionCount,
    tf: blueprint.scores.tf.questionCount * 4,
    short: blueprint.scores.short.questionCount,
  };

  const allocationReady =
    partTotals.mcq === targets.mcq &&
    partTotals.tf === targets.tf &&
    partTotals.short === targets.short &&
    blueprint.rows.length > 0;

  const tfScale = blueprint.scores.tf.scoreLevels;
  const tfScaleOrdered =
    tfScale.correct1 <= tfScale.correct2 &&
    tfScale.correct2 <= tfScale.correct3 &&
    tfScale.correct3 <= tfScale.correct4;

  const tfScaleWithinPercent =
    tfScale.correct1 >= 0 &&
    tfScale.correct4 <= 100;

  const lockIssues = useMemo(() => {
    const issues: string[] = [];
    if (blueprint.rows.length === 0) {
      issues.push(isEnglish ? 'Add at least one specification row.' : 'Thêm ít nhất một dòng đặc tả.');
    }
    PARTS.forEach((part) => {
      const current = partTotals[part.key];
      const target = targets[part.key];
      if (current === target) return;
      const unit = part.key === 'tf' ? (isEnglish ? 'statements' : 'ý') : (isEnglish ? 'questions' : 'câu');
      const difference = Math.abs(target - current);
      issues.push(isEnglish
        ? `${part.en}: allocated ${current}/${target} ${unit}; ${current < target ? 'add' : 'remove'} ${difference} ${unit}.`
        : `${part.vi}: đã phân bổ ${current}/${target} ${unit}; ${current < target ? 'còn thiếu' : 'thừa'} ${difference} ${unit}.`);
    });
    if (!tfScaleOrdered) {
      issues.push(isEnglish
        ? 'True/False scoring percentages must increase from 1/4 to 4/4 correct.'
        : 'Thang điểm Đúng/Sai phải tăng dần từ đúng 1 ý đến đúng 4 ý.');
    }
    if (!tfScaleWithinPercent) {
      issues.push(isEnglish
        ? 'True/False scoring percentages must be between 0% and 100%.'
        : 'Thang điểm Đúng/Sai phải nằm trong khoảng 0% đến 100%.');
    }
    // Reuse the engine's grouping checks before the user can lock the matrix.
    if (allocationReady) issues.push(...validateExamSlots(blueprint, buildExamSlots(blueprint)).issues);
    return issues;
  }, [blueprint, partTotals, allocationReady, tfScaleOrdered, tfScaleWithinPercent, isEnglish]);

  const canLockBlueprint = lockIssues.length === 0;

  const selectedOutcome = (row: BlueprintRow) => getOutcomeById(row.outcomeId);

  const rowTotal = (row: BlueprintRow) =>
    PARTS.reduce(
      (sum, part) =>
        sum +
        LEVELS.reduce((levelSum, level) => levelSum + row.allocations[part.key][level.key], 0),
      0,
    );

  const resetBlueprint = () => {
    if (window.confirm(isEnglish ? 'Reset the exam blueprint?' : 'Đặt lại toàn bộ bảng thiết kế đề?')) {
      se…17049 tokens truncated…         <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white dark:bg-sky-800">
                                      Câu {item.order}
                                    </span>
                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                      {item.slotId}
                                    </span>
                                    {isApproved && (
                                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                        ✓ {isEnglish ? 'Approved' : 'Đã duyệt'}
                                      </span>
                                    )}
                                    {isLocked && (
                                      <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        🔒 {isEnglish ? 'Locked' : 'Đã khóa'}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => toggleApproval(item.slotId)}
                                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
                                        isApproved
                                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
                                          : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                                      }`}
                                    >
                                      {isApproved ? (isEnglish ? '✓ Approved' : '✓ Đã duyệt') : (isEnglish ? '✓ Approve' : '✓ Duyệt')}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setEditingSlotId(isEditing ? null : item.slotId)}
                                      disabled={isLocked}
                                      className="rounded-lg border border-sky-200 px-2.5 py-1.5 text-xs font-bold text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-sky-800 dark:text-sky-300 dark:hover:bg-sky-950/30"
                                    >
                                      {isEditing ? (isEnglish ? 'Done editing' : 'Xong sửa') : (isEnglish ? '✎ Edit' : '✎ Sửa')}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => toggleQuestionLock(item.slotId)}
                                      className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                      {isLocked ? (isEnglish ? '🔓 Unlock' : '🔓 Mở khóa') : (isEnglish ? '🔒 Lock' : '🔒 Khóa')}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleRegenerateItem(item)}
                                      disabled={isLocked || generationSource === 'mock' || regeneratingSlotId === item.slotId}
                                      className="rounded-lg border border-purple-200 px-2.5 py-1.5 text-xs font-bold text-purple-700 transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-950/30"
                                    >
                                      {generationSource === 'mock'
                                        ? (isEnglish ? 'AI required' : 'Cần AI')
                                        : regeneratingSlotId === item.slotId
                                          ? (isEnglish ? 'Regenerating…' : 'Đang tạo lại…')
                                          : (isEnglish ? '↻ Regenerate' : '↻ Tạo lại')}
                                    </button>
                                  </div>
                                </div>

                                {isEditing ? (
                                  <div className="space-y-3">
                                    <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                      {isEnglish ? 'Question / stem' : 'Nội dung câu / đoạn dẫn'}
                                      <textarea
                                        value={item.question.question}
                                        onChange={(event) => updateGeneratedQuestion(item.slotId, 'question', event.target.value)}
                                        rows={4}
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm normal-case leading-relaxed text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                      />
                                    </label>

                                    {item.question.options.length > 0 && (
                                      <div className="space-y-2">
                                        <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                          {isEnglish ? 'Options / statements' : 'Phương án / các ý'}
                                        </div>
                                        {item.question.options.map((option, optionIndex) => (
                                          <input
                                            key={optionIndex}
                                            value={option}
                                            onChange={(event) => updateGeneratedOption(item.slotId, optionIndex, event.target.value)}
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                                          />
                                        ))}
                                      </div>
                                    )}

                                    <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                      {isEnglish ? 'Answer' : 'Đáp án'}
                                      <input
                                        value={item.question.answer}
                                        onChange={(event) => updateGeneratedQuestion(item.slotId, 'answer', event.target.value)}
                                        className="mt-1 w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm normal-case font-semibold text-emerald-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200"
                                      />
                                    </label>

                                    <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                      {isEnglish ? 'Explanation' : 'Giải thích'}
                                      <textarea
                                        value={item.question.explanation}
                                        onChange={(event) => updateGeneratedQuestion(item.slotId, 'explanation', event.target.value)}
                                        rows={3}
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm normal-case leading-relaxed text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                      />
                                    </label>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-100">
                                      {item.question.question}
                                    </p>

                                    {item.question.options.length > 0 && (
                                      <div className="mt-3 space-y-1.5">
                                        {item.question.options.map((option, optionIndex) => (
                                          <div key={optionIndex} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                            {option}
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200">
                                      <b>{isEnglish ? 'Answer:' : 'Đáp án:'}</b> {item.question.answer}
                                    </div>

                                    <details className="mt-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                                      <summary className="cursor-pointer font-bold">
                                        {isEnglish ? 'Explanation' : 'Giải thích'}
                                      </summary>
                                      <p className="mt-2 leading-relaxed">{item.question.explanation}</p>
                                    </details>
                                  </>
                                )}
                              </>
                            );
                          })()}
                        </article>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
