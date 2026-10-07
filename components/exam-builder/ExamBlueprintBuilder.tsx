import React, { useEffect, useMemo, useState } from 'react';
import {
  BIOLOGY_10_CONTENTS,
  BIOLOGY_10_OUTCOMES,
  getCompetenciesForContent,
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
import { generateExamFromSlots, generateExamItem } from '../../services/examGenerationService';
import type { GeneratedExamItem } from '../../types/generatedExam';
import { exportExamPackageDocx } from '../../services/examPackageDocxService';
import { getTrueFalseEarnedScore } from '../../services/examScoringService';
import { generateMockExamFromSlots } from '../../services/examMockService';
import { exportMixReadyExamDocx } from '../../services/examMixDocxService';
import { validateMixReadyExam } from '../../services/examMixValidationService';

const STORAGE_KEY = 'biogen_exam_blueprint_v1';

const defaultBlueprint = (): ExamBlueprint => ({
  grade: 10,
  title: 'Đề kiểm tra Sinh học',
  durationMinutes: 50,
  scores: {
    mcq: { questionCount: 12, totalScore: 6 },
    tf: {
      questionCount: 2,
      totalScore: 2,
      scoreLevels: { correct1: 10, correct2: 25, correct3: 50, correct4: 100 },
    },
    short: { questionCount: 4, totalScore: 2 },
  },
  rows: [],
});

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

const getDefaultRow = (): BlueprintRow => {
  const contentId = BIOLOGY_10_CONTENTS[0]?.id || '';
  const competencyCode = getCompetenciesForContent(contentId)[0]?.code || '';
  const outcomeId = getOutcomesForSelection(contentId, competencyCode)[0]?.id || '';
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

  const [lockedSlots, setLockedSlots] = useState<ExamSlotPackage | null>(null);
  const [slotIssues, setSlotIssues] = useState<string[]>([]);
  const [generatedItems, setGeneratedItems] = useState<GeneratedExamItem[]>([]);
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ completed: 0, total: 0 });
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [regeneratingSlotId, setRegeneratingSlotId] = useState<string | null>(null);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [approvedSlotIds, setApprovedSlotIds] = useState<string[]>([]);
  const [lockedQuestionIds, setLockedQuestionIds] = useState<string[]>([]);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [generationSource, setGenerationSource] = useState<'ai' | 'mock' | null>(null);
  const isBlueprintPreview = window.location.hostname === 'biogenai-blueprint-preview.onrender.com';

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blueprint));
    setLockedSlots(null);
    setSlotIssues([]);
    setGeneratedItems([]);
    setGenerationError(null);
    setGenerationProgress({ completed: 0, total: 0 });
    setApprovedSlotIds([]);
    setLockedQuestionIds([]);
    setEditingSlotId(null);
    setGenerationSource(null);
  }, [blueprint]);

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
      const nextCompetency = getCompetenciesForContent(value)[0]?.code || '';
      const nextOutcome = getOutcomesForSelection(value, nextCompetency)[0]?.id || '';
      updateRow(row.id, {
        contentId: value,
        competencyCode: nextCompetency,
        outcomeId: nextOutcome,
      });
      return;
    }

    if (field === 'competencyCode') {
      const nextOutcome = getOutcomesForSelection(row.contentId, value)[0]?.id || '';
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

  const selectedOutcome = (row: BlueprintRow) =>
    BIOLOGY_10_OUTCOMES.find((outcome) => outcome.id === row.outcomeId);

  const rowTotal = (row: BlueprintRow) =>
    PARTS.reduce(
      (sum, part) =>
        sum +
        LEVELS.reduce((levelSum, level) => levelSum + row.allocations[part.key][level.key], 0),
      0,
    );

  const resetBlueprint = () => {
    if (window.confirm(isEnglish ? 'Reset the exam blueprint?' : 'Đặt lại toàn bộ bảng thiết kế đề?')) {
      setBlueprint(defaultBlueprint());
    }
  };

  const lockBlueprint = () => {
    const slots = buildExamSlots(blueprint);
    const validation = validateExamSlots(blueprint, slots);
    setSlotIssues(validation.issues);
    setGeneratedItems([]);
    setApprovedSlotIds([]);
    setLockedQuestionIds([]);
    setEditingSlotId(null);
    setGenerationSource(null);
    setGenerationError(null);
    if (validation.valid) {
      setLockedSlots(slots);
    } else {
      setLockedSlots(null);
    }
  };

  const handleGenerateExam = async () => {
    if (!lockedSlots) return;

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setGenerationError(
        isEnglish
          ? 'The preview site does not have an AI API key configured yet.'
          : 'Bản preview chưa được cấu hình API key để gọi AI.',
      );
      return;
    }

    setIsGeneratingExam(true);
    setGeneratedItems([]);
    setApprovedSlotIds([]);
    setLockedQuestionIds([]);
    setEditingSlotId(null);
    setGenerationSource(null);
    setGenerationError(null);
    const total = lockedSlots.mcq.length + lockedSlots.tf.length + lockedSlots.short.length;
    setGenerationProgress({ completed: 0, total });

    try {
      const items = await generateExamFromSlots(
        apiKey,
        lockedSlots,
        i18n.language,
        setGenerationProgress,
      );
      setGeneratedItems(items);
      setGenerationSource('ai');
    } catch (error: any) {
      console.error('Exam generation error:', error);
      setGenerationError(error?.message || (isEnglish ? 'Exam generation failed.' : 'Không thể tạo đề.'));
    } finally {
      setIsGeneratingExam(false);
    }
  };

  const handleGenerateMockExam = () => {
    if (!lockedSlots) return;
    const items = generateMockExamFromSlots(lockedSlots);
    setGeneratedItems(items);
    setApprovedSlotIds([]);
    setLockedQuestionIds([]);
    setEditingSlotId(null);
    setGenerationError(null);
    setGenerationSource('mock');
  };

  const handleRegenerateItem = async (item: GeneratedExamItem) => {
    if (!lockedSlots) return;

    if (lockedQuestionIds.includes(item.slotId)) {
      setGenerationError(
        isEnglish
          ? 'Unlock this question before regenerating it.'
          : 'Hãy mở khóa câu này trước khi tạo lại.',
      );
      return;
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setGenerationError(
        isEnglish
          ? 'The preview site does not have an AI API key configured yet.'
          : 'Bản preview chưa được cấu hình API key để gọi AI.',
      );
      return;
    }

    const slot =
      item.part === 'mcq'
        ? lockedSlots.mcq.find((candidate) => candidate.id === item.slotId)
        : item.part === 'tf'
          ? lockedSlots.tf.find((candidate) => candidate.id === item.slotId)
          : lockedSlots.short.find((candidate) => candidate.id === item.slotId);

    if (!slot) return;

    setRegeneratingSlotId(item.slotId);
    setGenerationError(null);

    try {
      const replacement = await generateExamItem(apiKey, slot, i18n.language);
      setGeneratedItems((current) =>
        current.map((candidate) => candidate.slotId === item.slotId ? replacement : candidate),
      );
      setApprovedSlotIds((current) => current.filter((id) => id !== item.slotId));
      setEditingSlotId(null);
    } catch (error: any) {
      console.error('Regenerate question error:', error);
      setGenerationError(error?.message || (isEnglish ? 'Could not regenerate this question.' : 'Không thể tạo lại câu này.'));
    } finally {
      setRegeneratingSlotId(null);
    }
  };

  const toggleApproval = (slotId: string) => {
    setApprovedSlotIds((current) =>
      current.includes(slotId)
        ? current.filter((id) => id !== slotId)
        : [...current, slotId],
    );
  };

  const toggleQuestionLock = (slotId: string) => {
    const isLocked = lockedQuestionIds.includes(slotId);
    if (isLocked) {
      setLockedQuestionIds((current) => current.filter((id) => id !== slotId));
      return;
    }

    setLockedQuestionIds((current) => [...current, slotId]);
    setApprovedSlotIds((current) => current.includes(slotId) ? current : [...current, slotId]);
    if (editingSlotId === slotId) setEditingSlotId(null);
  };

  const updateGeneratedQuestion = (
    slotId: string,
    field: 'question' | 'answer' | 'explanation',
    value: string,
  ) => {
    if (lockedQuestionIds.includes(slotId)) return;
    setGeneratedItems((current) =>
      current.map((item) =>
        item.slotId === slotId
          ? { ...item, question: { ...item.question, [field]: value } }
          : item,
      ),
    );
    setApprovedSlotIds((current) => current.filter((id) => id !== slotId));
  };

  const updateGeneratedOption = (slotId: string, optionIndex: number, value: string) => {
    if (lockedQuestionIds.includes(slotId)) return;
    setGeneratedItems((current) =>
      current.map((item) => {
        if (item.slotId !== slotId) return item;
        const options = [...item.question.options];
        options[optionIndex] = value;
        return { ...item, question: { ...item.question, options } };
      }),
    );
    setApprovedSlotIds((current) => current.filter((id) => id !== slotId));
  };

  const handleExportMixDocx = async () => {
    if (!mixValidation.valid) {
      setGenerationError(
        isEnglish
          ? 'Fix mixer-format issues before exporting the DOCX.'
          : 'Hãy sửa các lỗi tương thích trộn đề trước khi xuất DOCX.',
      );
      return;
    }

    setIsExportingDocx(true);
    try {
      await exportMixReadyExamDocx(blueprint, generatedItems);
    } catch (error: any) {
      console.error('Mix-ready DOCX export error:', error);
      setGenerationError(
        error?.message ||
          (isEnglish
            ? 'Could not export the mixer-compatible DOCX file.'
            : 'Không thể xuất file DOCX theo format trộn đề.'),
      );
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleExportDocx = async (includeExam: boolean) => {
    setIsExportingDocx(true);
    try {
      await exportExamPackageDocx(blueprint, includeExam ? generatedItems : []);
    } catch (error) {
      console.error('DOCX export error:', error);
      setGenerationError(
        isEnglish
          ? 'Could not export the DOCX file.'
          : 'Không thể xuất file DOCX.',
      );
    } finally {
      setIsExportingDocx(false);
    }
  };

  const partTitle = (part: ExamPartKey) => {
    if (part === 'mcq') return isEnglish ? 'Part I · Multiple choice' : 'PHẦN I · Trắc nghiệm nhiều lựa chọn';
    if (part === 'tf') return isEnglish ? 'Part II · True/False' : 'PHẦN II · Trắc nghiệm Đúng/Sai';
    return isEnglish ? 'Part III · Short response' : 'PHẦN III · Trả lời ngắn';
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <section className="rounded-xl border border-sky-100 bg-sky-50/70 p-4 dark:border-sky-900/60 dark:bg-sky-950/20">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              {isEnglish ? 'Exam blueprint' : 'Thiết kế đề kiểm tra'}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {isEnglish
                ? 'Build one combined specification + matrix before generating questions.'
                : 'Ghép ma trận và bản đặc tả trong một bảng. Chưa sinh câu hỏi AI ở bước thử nghiệm này.'}
            </p>
          </div>
          <button
            type="button"
            onClick={resetBlueprint}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            {isEnglish ? 'Reset' : 'Đặt lại'}
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {isEnglish ? 'Grade' : 'Lớp'}
            <select
              value={blueprint.grade}
              onChange={(event) => setBlueprint((current) => ({ ...current, grade: Number(event.target.value) as 10 | 11 | 12 }))}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm normal-case text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value={10}>{isEnglish ? 'Grade 10' : 'Lớp 10'}</option>
              <option value={11} disabled>{isEnglish ? 'Grade 11 — coming soon' : 'Lớp 11 — bổ sung sau'}</option>
              <option value={12} disabled>{isEnglish ? 'Grade 12 — coming soon' : 'Lớp 12 — bổ sung sau'}</option>
            </select>
          </label>

          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {isEnglish ? 'Exam title' : 'Tên đề'}
            <input
              value={blueprint.title}
              onChange={(event) => setBlueprint((current) => ({ ...current, title: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm normal-case text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
          </label>

          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {isEnglish ? 'Duration (min)' : 'Thời gian (phút)'}
            <NumericInput
              value={blueprint.durationMinutes}
              onChange={(value) => setBlueprint((current) => ({ ...current, durationMinutes: value }))}
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h4 className="mb-3 text-sm font-bold text-slate-800 dark:text-white">
          {isEnglish ? '1. Part scores' : '1. Thiết lập điểm từng phần'}
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[660px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-400 dark:border-slate-700">
                <th className="px-2 py-2">{isEnglish ? 'Part' : 'Phần'}</th>
                <th className="px-2 py-2 text-center">{isEnglish ? 'Questions' : 'Số câu'}</th>
                <th className="px-2 py-2 text-center">{isEnglish ? 'Total score' : 'Tổng điểm'}</th>
                <th className="px-2 py-2 text-right">{isEnglish ? 'Auto score/question' : 'App tính điểm/câu'}</th>
              </tr>
            </thead>
            <tbody>
              {PARTS.map((part) => (
                <tr key={part.key} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="px-2 py-2 font-semibold text-slate-700 dark:text-slate-200">
                    {isEnglish ? part.en : part.vi}
                  </td>
                  <td className="w-28 px-2 py-2">
                    <NumericInput
                      value={blueprint.scores[part.key].questionCount}
                      onChange={(value) => updateScorePart(part.key, 'questionCount', Math.floor(value))}
                    />
                  </td>
                  <td className="w-28 px-2 py-2">
                    <NumericInput
                      value={blueprint.scores[part.key].totalScore}
                      step={0.25}
                      onChange={(value) => updateScorePart(part.key, 'totalScore', value)}
                    />
                  </td>
                  <td className="px-2 py-2 text-right font-bold text-sky-700 dark:text-sky-300">
                    {round(perQuestion[part.key], 3).toLocaleString(isEnglish ? 'en-US' : 'vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="px-2 pt-3 text-right text-xs font-bold uppercase text-slate-400">
                  {isEnglish ? 'Total' : 'Tổng'}
                </td>
                <td className="px-2 pt-3 text-center text-lg font-extrabold text-slate-900 dark:text-white">
                  {round(totalScore).toLocaleString(isEnglish ? 'en-US' : 'vi-VN')}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-4 rounded-xl border border-purple-100 bg-purple-50/60 p-3 dark:border-purple-900/50 dark:bg-purple-950/20">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <strong className="text-sm text-purple-800 dark:text-purple-200">
                {isEnglish ? 'True/False scoring · percentage of each question' : 'Thang điểm câu Đúng/Sai · % điểm của mỗi câu'}
              </strong>
              <p className="mt-1 text-[11px] text-purple-600/80 dark:text-purple-300/80">
                {isEnglish
                  ? 'The four values below are percentages of the maximum score of one True/False question.'
                  : 'Bốn mức dưới đây là tỷ lệ % của điểm tối đa một câu Đúng/Sai, không phải điểm tuyệt đối.'}
              </p>
            </div>
            <span className="text-xs text-purple-600 dark:text-purple-300">
              {isEnglish ? 'Max/question' : 'Điểm tối đa/câu'}: <b>{round(perQuestion.tf, 3)}</b>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {(['correct1', 'correct2', 'correct3', 'correct4'] as const).map((key, index) => {
              const correctCount = (index + 1) as 1 | 2 | 3 | 4;
              const earned = getTrueFalseEarnedScore(blueprint, correctCount);

              return (
                <label key={key} className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {isEnglish ? `${index + 1}/4 correct (%)` : `Đúng ${index + 1}/4 ý (%)`}
                  <NumericInput
                    value={blueprint.scores.tf.scoreLevels[key]}
                    step={1}
                    onChange={(value) => updateTfLevel(key, Math.min(100, value))}
                    className="mt-1"
                  />
                  <span className="mt-1 block text-center text-[10px] font-semibold normal-case text-purple-700 dark:text-purple-300">
                    → {round(earned, 3).toLocaleString(isEnglish ? 'en-US' : 'vi-VN')} {isEnglish ? 'pts' : 'điểm'}
                  </span>
                </label>
              );
            })}
          </div>

          {!tfScaleOrdered && (
            <p className="mt-2 text-xs font-semibold text-red-600">
              {isEnglish
                ? 'Percentages should increase from 1/4 to 4/4 correct.'
                : 'Bốn mức phần trăm nên tăng dần từ đúng 1 ý đến đúng 4 ý.'}
            </p>
          )}

          {!tfScaleWithinPercent && (
            <p className="mt-2 text-xs font-semibold text-red-600">
              {isEnglish
                ? 'True/False scoring percentages must stay between 0% and 100%.'
                : 'Tỷ lệ chấm Đúng/Sai phải nằm trong khoảng 0% đến 100%.'}
            </p>
          )}

          {tfScale.correct4 !== 100 && (
            <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
              {isEnglish
                ? 'With 4/4 correct below 100%, the configured total score for Part II cannot be fully reached.'
                : 'Nếu mức đúng 4/4 thấp hơn 100%, thí sinh sẽ không thể đạt đủ tổng điểm tối đa của Phần II.'}
            </p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">
              {isEnglish ? '2. Combined specification + matrix' : '2. Bảng đặc tả + ma trận'}
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              {isEnglish
                ? 'Choose content → competency → learning outcome, then allocate items by level.'
                : 'Chọn Nội dung → Năng lực → Yêu cầu cần đạt, sau đó nhập số câu/lệnh hỏi theo Biết – Hiểu – Vận dụng.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setBlueprint((current) => ({ ...current, rows: [...current.rows, getDefaultRow()] }))}
            className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-700"
          >
            + {isEnglish ? 'Add content' : 'Thêm nội dung'}
          </button>
        </div>

        {blueprint.rows.length === 0 ? (
          <button
            type="button"
            onClick={() => setBlueprint((current) => ({ ...current, rows: [getDefaultRow()] }))}
            className="w-full rounded-xl border-2 border-dashed border-slate-200 px-4 py-8 text-sm font-semibold text-slate-400 transition hover:border-sky-300 hover:text-sky-600 dark:border-slate-700"
          >
            + {isEnglish ? 'Add the first specification row' : 'Thêm dòng đặc tả đầu tiên'}
          </button>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full min-w-[1450px] text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80">
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th rowSpan={2} className="w-44 px-2 py-2 text-left">Nội dung</th>
                  <th rowSpan={2} className="w-32 px-2 py-2 text-left">Năng lực</th>
                  <th rowSpan={2} className="w-[360px] px-2 py-2 text-left">Yêu cầu cần đạt</th>
                  {PARTS.map((part) => (
                    <th key={part.key} colSpan={3} className="border-l border-slate-200 px-2 py-2 text-center dark:border-slate-700">
                      {isEnglish ? part.en : part.vi}
                    </th>
                  ))}
                  <th rowSpan={2} className="w-20 border-l border-slate-200 px-2 py-2 text-center dark:border-slate-700">
                    {isEnglish ? 'Total' : 'Tổng'}
                  </th>
                  <th rowSpan={2} className="w-12 px-2 py-2" />
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  {PARTS.flatMap((part) =>
                    LEVELS.map((level) => (
                      <th key={`${part.key}-${level.key}`} className="border-l border-slate-200 px-1 py-2 text-center dark:border-slate-700">
                        {isEnglish ? level.en : level.vi}
                      </th>
                    )),
                  )}
                </tr>
              </thead>

              <tbody>
                {blueprint.rows.map((row) => {
                  const competencies = getCompetenciesForContent(row.contentId);
                  const outcomes = getOutcomesForSelection(row.contentId, row.competencyCode);
                  const outcome = selectedOutcome(row);

                  return (
                    <tr key={row.id} className="border-b border-slate-100 align-top last:border-0 dark:border-slate-800">
                      <td className="p-2">
                        <select
                          value={row.contentId}
                          onChange={(event) => updateRowSelection(row, 'contentId', event.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                        >
                          {BIOLOGY_10_CONTENTS.map((content) => (
                            <option key={content.id} value={content.id}>{content.label}</option>
                          ))}
                        </select>
                      </td>

                      <td className="p-2">
                        <select
                          value={row.competencyCode}
                          onChange={(event) => updateRowSelection(row, 'competencyCode', event.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                        >
                          {competencies.map((competency) => (
                            <option key={competency.code} value={competency.code}>
                              {competency.code} · {competency.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-2">
                        <select
                          value={row.outcomeId}
                          onChange={(event) => updateRowSelection(row, 'outcomeId', event.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs leading-relaxed dark:border-slate-700 dark:bg-slate-900"
                        >
                          {outcomes.map((item) => (
                            <option key={item.id} value={item.id}>{item.text}</option>
                          ))}
                        </select>
                        {outcome && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-bold uppercase dark:bg-slate-800">
                              {LEVELS.find((level) => level.key === outcome.level)?.vi}
                            </span>
                            <span>{outcome.competencyCode}</span>
                          </div>
                        )}
                      </td>

                      {PARTS.flatMap((part) =>
                        LEVELS.map((level) => (
                          <td key={`${row.id}-${part.key}-${level.key}`} className="w-16 border-l border-slate-100 p-1.5 dark:border-slate-800">
                            <NumericInput
                              value={row.allocations[part.key][level.key]}
                              onChange={(value) => updateAllocation(row, part.key, level.key, value)}
                            />
                          </td>
                        )),
                      )}

                      <td className="border-l border-slate-100 p-2 text-center text-base font-extrabold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                        {rowTotal(row)}
                      </td>

                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => setBlueprint((current) => ({
                            ...current,
                            rows: current.rows.filter((item) => item.id !== row.id),
                          }))}
                          className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
                          aria-label="Remove row"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot className="bg-slate-50 font-bold dark:bg-slate-800/80">
                <tr className="border-t-2 border-slate-300 dark:border-slate-600">
                  <td colSpan={3} className="px-3 py-3 text-right uppercase text-slate-500">
                    {isEnglish ? 'Column totals' : 'Tổng theo cột'}
                  </td>
                  {PARTS.flatMap((part) =>
                    LEVELS.map((level) => (
                      <td key={`total-${part.key}-${level.key}`} className="border-l border-slate-200 px-2 py-3 text-center text-sm dark:border-slate-700">
                        {totals[part.key][level.key]}
                      </td>
                    )),
                  )}
                  <td className="border-l border-slate-200 px-2 py-3 text-center text-base dark:border-slate-700">
                    {partTotals.mcq + partTotals.tf + partTotals.short}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h4 className="mb-3 text-sm font-bold text-slate-800 dark:text-white">
          {isEnglish ? '3. Live totals' : '3. Tổng hợp trực tiếp'}
        </h4>

        <div className="grid gap-3 md:grid-cols-3">
          {PARTS.map((part) => {
            const current = partTotals[part.key];
            const target = targets[part.key];
            const isMatch = current === target;
            return (
              <div
                key={part.key}
                className={`rounded-xl border p-3 ${isMatch
                  ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                  : 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-sm text-slate-800 dark:text-slate-100">
                    {isEnglish ? part.en : part.vi}
                  </strong>
                  <span className={`text-xs font-extrabold ${isMatch ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {current}/{target}
                    {part.key === 'tf' ? (isEnglish ? ' statements' : ' ý') : (isEnglish ? ' questions' : ' câu')}
                  </span>
                </div>
                <div className="mt-2 flex justify-between text-xs text-slate-500">
                  <span>B {totals[part.key].know}</span>
                  <span>H {totals[part.key].understand}</span>
                  <span>VD {totals[part.key].apply}</span>
                </div>
                <div className="mt-2 text-right text-sm font-bold text-slate-700 dark:text-slate-200">
                  {blueprint.scores[part.key].totalScore} {isEnglish ? 'pts' : 'điểm'}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
            <span className="block text-[10px] font-bold uppercase text-slate-400">Biết</span>
            <strong className="text-xl text-slate-800 dark:text-white">{cognitiveTotals.know}</strong>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
            <span className="block text-[10px] font-bold uppercase text-slate-400">Hiểu</span>
            <strong className="text-xl text-slate-800 dark:text-white">{cognitiveTotals.understand}</strong>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
            <span className="block text-[10px] font-bold uppercase text-slate-400">Vận dụng</span>
            <strong className="text-xl text-slate-800 dark:text-white">{cognitiveTotals.apply}</strong>
          </div>
          <div className="rounded-xl bg-slate-900 p-3 text-white dark:bg-sky-900">
            <span className="block text-[10px] font-bold uppercase text-slate-300">{isEnglish ? 'Total score' : 'Tổng điểm'}</span>
            <strong className="text-xl">{round(totalScore)}</strong>
          </div>
        </div>

        <div className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${allocationReady
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200'
          : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200'}`}
        >
          {allocationReady
            ? (isEnglish
                ? '✓ The allocation matches all three part settings.'
                : '✓ Phân bổ đã khớp số câu/lệnh hỏi của cả 3 phần.')
            : (isEnglish
                ? 'Complete the allocation until each part matches its configured number of questions/statements.'
                : 'Hãy phân bổ đến khi tổng các cột khớp số câu/lệnh hỏi đã thiết lập ở từng phần.')}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={lockBlueprint}
            disabled={!allocationReady || !tfScaleOrdered || !tfScaleWithinPercent}
            className="w-full rounded-xl bg-sky-600 px-4 py-3 font-bold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
          >
            {isEnglish ? 'Lock blueprint & preview exam structure' : 'Khóa ma trận & xem cấu trúc đề'}
          </button>

          <button
            type="button"
            onClick={() => handleExportDocx(false)}
            disabled={blueprint.rows.length === 0 || isExportingDocx}
            className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300"
          >
            {isExportingDocx
              ? (isEnglish ? 'Exporting…' : 'Đang xuất…')
              : (isEnglish ? 'Download matrix + specification DOCX' : 'Tải ma trận + đặc tả DOCX')}
          </button>
        </div>

        {slotIssues.length > 0 && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-200">
            <strong className="block mb-1">{isEnglish ? 'Please fix:' : 'Cần chỉnh:'}</strong>
            <ul className="list-disc space-y-1 pl-5">
              {slotIssues.map((issue) => <li key={issue}>{issue}</li>)}
            </ul>
          </div>
        )}

        {lockedSlots && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <strong className="text-sm text-emerald-800 dark:text-emerald-200">
                  {isEnglish ? 'Blueprint locked' : 'Đã khóa blueprint'}
                </strong>
                <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-300/80">
                  {isEnglish
                    ? 'The app has converted the matrix into deterministic question slots.'
                    : 'App đã chuyển ma trận thành danh sách slot câu hỏi cố định trước khi gọi AI.'}
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300">
                {lockedSlots.mcq.length + lockedSlots.tf.length + lockedSlots.short.length} {isEnglish ? 'questions' : 'câu'}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg bg-white p-3 shadow-sm dark:bg-slate-900">
                <div className="mb-2 text-xs font-bold uppercase text-slate-400">Phần I</div>
                <div className="space-y-1">
                  {lockedSlots.mcq.slice(0, 6).map((slot) => (
                    <div key={slot.id} className="flex items-start justify-between gap-2 text-xs">
                      <span><b>Câu {slot.order}</b> · {slot.contentLabel}</span>
                      <span className="whitespace-nowrap text-slate-400">{LEVELS.find((l) => l.key === slot.level)?.vi}</span>
                    </div>
                  ))}
                  {lockedSlots.mcq.length > 6 && <div className="text-[11px] text-slate-400">… +{lockedSlots.mcq.length - 6} câu</div>}
                </div>
              </div>

              <div className="rounded-lg bg-white p-3 shadow-sm dark:bg-slate-900">
                <div className="mb-2 text-xs font-bold uppercase text-slate-400">Phần II</div>
                <div className="space-y-2">
                  {lockedSlots.tf.map((slot) => (
                    <div key={slot.id} className="rounded-lg border border-slate-100 p-2 dark:border-slate-800">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <b>Câu {slot.order}</b>
                        <span className="text-slate-400">{round(slot.maxScore, 3)} điểm</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {slot.statements.map((statement) => (
                          <span key={statement.id} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] dark:bg-slate-800">
                            {String.fromCharCode(96 + statement.statementOrder)}) {LEVELS.find((l) => l.key === statement.level)?.vi}
                          </span>
                        ))}
                      </div>
                      <div className="mt-1 truncate text-[10px] text-slate-400">{slot.statements[0]?.contentLabel}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-white p-3 shadow-sm dark:bg-slate-900">
                <div className="mb-2 text-xs font-bold uppercase text-slate-400">Phần III</div>
                <div className="space-y-1">
                  {lockedSlots.short.map((slot) => (
                    <div key={slot.id} className="flex items-start justify-between gap-2 text-xs">
                      <span><b>Câu {slot.order}</b> · {slot.contentLabel}</span>
                      <span className="whitespace-nowrap text-slate-400">{LEVELS.find((l) => l.key === slot.level)?.vi}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={`mt-3 grid gap-2 ${isBlueprintPreview ? 'sm:grid-cols-2' : ''}`}>
              <button
                type="button"
                onClick={handleGenerateExam}
                disabled={isGeneratingExam}
                className="w-full rounded-xl bg-purple-600 px-4 py-3 font-bold text-white shadow-sm transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGeneratingExam
                  ? (isEnglish
                      ? `Generating ${generationProgress.completed}/${generationProgress.total}...`
                      : `Đang tạo ${generationProgress.completed}/${generationProgress.total} câu...`)
                  : (isEnglish ? 'Generate exam with AI' : 'Tạo đề bằng AI')}
              </button>

              {isBlueprintPreview && (
                <button
                  type="button"
                  onClick={handleGenerateMockExam}
                  disabled={isGeneratingExam}
                  className="w-full rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 font-bold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300"
                >
                  {isEnglish ? 'Create demo exam for workflow testing' : 'Tạo đề mẫu để kiểm thử workflow'}
                </button>
              )}
            </div>

            {isBlueprintPreview && (
              <p className="mt-2 text-center text-[11px] text-amber-700 dark:text-amber-300">
                {isEnglish
                  ? 'Demo questions are placeholders only. They let you test review, editing, locking, and DOCX export without an API key.'
                  : 'Đề mẫu chỉ là dữ liệu giả để kiểm thử Duyệt – Sửa – Khóa – Xuất DOCX, không dùng làm câu hỏi thật.'}
              </p>
            )}

            {isGeneratingExam && generationProgress.total > 0 && (
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-purple-100 dark:bg-purple-950">
                <div
                  className="h-full bg-purple-600 transition-all"
                  style={{ width: `${Math.round((generationProgress.completed / generationProgress.total) * 100)}%` }}
                />
              </div>
            )}

            {generationError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-200">
                {generationError}
              </div>
            )}

            {generatedItems.length > 0 && (
              <div className="mt-5 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h5 className="text-sm font-bold text-slate-800 dark:text-white">
                      {generationSource === 'mock'
                        ? (isEnglish ? 'Demo exam workflow review' : 'Duyệt đề mẫu kiểm thử')
                        : (isEnglish ? 'AI-generated exam review' : 'Duyệt đề AI đã tạo')}
                    </h5>
                    <p className="mt-1 text-xs text-slate-500">
                      {generationSource === 'mock'
                        ? (isEnglish
                            ? 'Demo content is tied to the locked slots so you can test the complete review and DOCX workflow.'
                            : 'Dữ liệu mẫu vẫn gắn đúng slot đã khóa để anh kiểm thử đầy đủ quy trình duyệt và DOCX.')
                        : (isEnglish
                            ? 'Each question remains tied to its locked slot. Regenerate only the question that needs revision.'
                            : 'Mỗi câu vẫn gắn với slot đã khóa. Chỉ tạo lại câu cần sửa, không sinh lại toàn bộ đề.')}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {generationSource === 'mock' && (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        DEMO
                      </span>
                    )}
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-extrabold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      {generatedItems.length} {isEnglish ? 'questions' : 'câu'}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      ✓ {approvedSlotIds.length}/{generatedItems.length} {isEnglish ? 'approved' : 'đã duyệt'}
                    </span>
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      🔒 {lockedQuestionIds.length}/{generatedItems.length}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3 dark:border-sky-900/50 dark:bg-sky-950/20">
                  <p className="text-xs leading-relaxed text-sky-800 dark:text-sky-200">
                    {isEnglish
                      ? 'Mixer DOCX contract: underline only the correct A/B/C/D letter in Part I; underline the a/b/c/d letters of TRUE statements in Part II; Part III answers use “A. number” with at most 4 characters.'
                      : 'Format DOCX để trộn: Phần I chỉ gạch dưới ký tự A/B/C/D của đáp án đúng; Phần II chỉ gạch dưới ký tự a/b/c/d của các ý Đúng; Phần III ghi “A. số”, tối đa 4 ký tự.'}
                  </p>
                </div>

                <div className={`rounded-xl border px-4 py-3 text-sm ${
                  mixValidation.valid
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200'
                    : 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-200'
                }`}>
                  {mixValidation.valid ? (
                    <strong>✓ {isEnglish ? 'Mixer DOCX format is valid.' : 'Đề đã đạt điều kiện format để trộn.'}</strong>
                  ) : (
                    <>
                      <strong className="block mb-1">
                        {isEnglish ? 'Mixer format issues:' : 'Lỗi format trộn đề:'}
                      </strong>
                      <ul className="list-disc space-y-1 pl-5 text-xs">
                        {mixValidation.issues.map((issue, index) => (
                          <li key={`${issue.slotId}-${index}`}>
                            {isEnglish ? 'Question' : 'Câu'} {issue.order} · {issue.message}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleExportMixDocx}
                    disabled={isExportingDocx || !mixValidation.valid}
                    className="w-full rounded-xl bg-sky-700 px-4 py-3 font-bold text-white shadow-sm transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isExportingDocx
                      ? (isEnglish ? 'Exporting DOCX…' : 'Đang xuất DOCX…')
                      : (isEnglish ? 'Download mixer-ready DOCX' : 'Tải đề DOCX để trộn')}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportDocx(true)}
                    disabled={isExportingDocx}
                    className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300"
                  >
                    {isExportingDocx
                      ? (isEnglish ? 'Exporting…' : 'Đang xuất…')
                      : (isEnglish ? 'Download full exam dossier' : 'Tải bộ hồ sơ đề')}
                  </button>
                </div>

                {(['mcq', 'tf', 'short'] as ExamPartKey[]).map((part) => {
                  const partItems = generatedItems.filter((item) => item.part === part);
                  if (partItems.length === 0) return null;

                  return (
                    <div key={part} className="space-y-3">
                      <div className="border-b border-slate-200 pb-2 text-sm font-extrabold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                        {partTitle(part)}
                      </div>

                      {partItems.map((item) => (
                        <article key={item.slotId} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                          {(() => {
                            const isApproved = approvedSlotIds.includes(item.slotId);
                            const isLocked = lockedQuestionIds.includes(item.slotId);
                            const isEditing = editingSlotId === item.slotId;

                            return (
                              <>
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-2">
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
