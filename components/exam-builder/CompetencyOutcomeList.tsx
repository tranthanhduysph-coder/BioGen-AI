import React from 'react';
import type { BiologyLearningOutcome } from '../../types/examBlueprint';
import { getSpecificationSourceLabel, getSpecificationSourceUrl } from '../../data/biologySpecification/catalog';

export const CurriculumOutcomeReference: React.FC<{ outcome: BiologyLearningOutcome; isEnglish: boolean }> = ({ outcome, isEnglish }) => {
  const alignment = outcome.curriculumAlignment;
  if (!alignment) return null;
  return <div className="mt-1 text-[11px] leading-relaxed">
    <a href={getSpecificationSourceUrl(alignment.pages[0], 'curriculum')} target="_blank" rel="noreferrer" className="text-sky-700 underline dark:text-sky-300">
      {isEnglish ? 'Curriculum outcome' : 'YCCĐ chương trình'} · CTGDPT 2018 · {isEnglish ? 'Pages' : 'Trang'} {alignment.pages.join(', ')}
    </a>
    {alignment.status === 'source_variant' && <details className="mt-1 text-amber-800 dark:text-amber-200">
      <summary className="cursor-pointer">{isEnglish ? 'Source wording differs from the curriculum' : 'Bản đặc tả diễn đạt khác chương trình'}</summary>
      <p className="mt-1">{alignment.note}</p>
      <p className="mt-1 text-slate-700 dark:text-slate-200">{alignment.curriculumText}</p>
    </details>}
  </div>;
};

export const CompetencyOutcomeList: React.FC<{
  outcomes: BiologyLearningOutcome[];
  competencyCode: string;
  selectedOutcomeId: string;
  onSelect: (outcomeId: string) => void;
  isEnglish: boolean;
}> = ({ outcomes, competencyCode, selectedOutcomeId, onSelect, isEnglish }) => <details className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-950">
  <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-200">
    {isEnglish ? 'Corresponding outcomes' : 'YCCĐ tương ứng'} · {competencyCode || (isEnglish ? 'Source code absent' : 'Nguồn chưa gán mã')} · {outcomes.length}
  </summary>
  <p className="mt-2 leading-relaxed text-slate-500">
    {competencyCode
      ? (isEnglish ? 'Includes outcomes whose printed compound code contains this competency. Codes remain as printed in the specification.' : 'Gồm cả YCCĐ có mã ghép chứa năng lực này. Mã gốc được giữ đúng theo bản đặc tả.')
      : (isEnglish ? 'The source does not assign these outcomes to a competency. No assignment is inferred from their verbs.' : 'Nguồn chưa gán năng lực cho các YCCĐ này. Không suy mã từ động từ của yêu cầu.')}
  </p>
  <ol className="mt-2 max-h-[420px] space-y-3 overflow-y-auto pr-1">
    {outcomes.map((outcome, index) => <li key={outcome.id} className={`rounded border p-2 ${outcome.id === selectedOutcomeId ? 'border-sky-300 bg-sky-50 dark:bg-sky-950' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}>
      <p className="whitespace-normal break-words leading-relaxed">{index + 1}. {outcome.text}</p>
      <p className="mt-1 text-[11px] text-slate-500">{isEnglish ? 'Printed competency code' : 'Mã năng lực trong nguồn'}: {outcome.competencyCode || (isEnglish ? 'Not specified' : 'Chưa ghi mã')}</p>
      {outcome.sourcePage && <a href={getSpecificationSourceUrl(outcome.sourcePage, outcome.sourceId)} target="_blank" rel="noreferrer" className="text-[11px] text-sky-700 underline dark:text-sky-300">
        {getSpecificationSourceLabel(outcome.sourceId)} · {isEnglish ? 'Pages' : 'Trang'} {outcome.sourcePages?.join(', ') || outcome.sourcePage}
      </a>}
      <CurriculumOutcomeReference outcome={outcome} isEnglish={isEnglish} />
      <button type="button" onClick={() => onSelect(outcome.id)} aria-pressed={outcome.id === selectedOutcomeId} className="mt-2 rounded border border-sky-200 px-2 py-1 font-semibold text-sky-700 dark:border-sky-800 dark:text-sky-300">
        {outcome.id === selectedOutcomeId ? (isEnglish ? 'Selected' : 'Đã chọn') : (isEnglish ? 'Select this outcome' : 'Chọn YCCĐ này')}
      </button>
    </li>)}
  </ol>
</details>;
