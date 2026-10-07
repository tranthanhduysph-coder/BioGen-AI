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
      scoreLevels: { correct1: 0.1, correct2: 0.25, correct3: 0.5, correct4: 1 },
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
      return saved ? JSON.parse(saved) : defaultBlueprint();
    } catch {
      return defaultBlueprint();
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blueprint));
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
            <strong className="text-sm text-purple-800 dark:text-purple-200">
              {isEnglish ? 'True/False scoring · 4 statements' : 'Thang điểm câu Đúng/Sai · 4 ý'}
            </strong>
            <span className="text-xs text-purple-600 dark:text-purple-300">
              {isEnglish ? 'Max/question' : 'Điểm tối đa/câu'}: <b>{round(perQuestion.tf, 3)}</b>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {(['correct1', 'correct2', 'correct3', 'correct4'] as const).map((key, index) => (
              <label key={key} className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {isEnglish ? `${index + 1}/4 correct` : `Đúng ${index + 1}/4 ý`}
                <NumericInput
                  value={blueprint.scores.tf.scoreLevels[key]}
                  step={0.05}
                  onChange={(value) => updateTfLevel(key, value)}
                  className="mt-1"
                />
              </label>
            ))}
          </div>

          {!tfScaleOrdered && (
            <p className="mt-2 text-xs font-semibold text-red-600">
              {isEnglish
                ? 'Scoring levels should increase from 1/4 to 4/4 correct.'
                : 'Bốn bậc điểm nên tăng dần từ đúng 1 ý đến đúng 4 ý.'}
            </p>
          )}

          {Math.abs(tfScale.correct4 - perQuestion.tf) > 0.0001 && (
            <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
              {isEnglish
                ? `4/4 score is ${tfScale.correct4}, while the calculated maximum per question is ${round(perQuestion.tf, 3)}.`
                : `Mức đúng 4/4 đang là ${tfScale.correct4}, trong khi điểm tối đa app tính cho mỗi câu là ${round(perQuestion.tf, 3)}.`}
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

        <button
          type="button"
          disabled
          className="mt-3 w-full cursor-not-allowed rounded-xl bg-slate-300 px-4 py-3 font-bold text-white dark:bg-slate-700"
          title={isEnglish ? 'AI generation will be connected after the blueprint UI is validated.' : 'Sẽ nối AI sau khi chốt giao diện blueprint.'}
        >
          {isEnglish ? 'Lock blueprint & generate exam — next phase' : 'Khóa ma trận & tạo đề — bước tiếp theo'}
        </button>
      </section>
    </div>
  );
};
