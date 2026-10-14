import React, { useEffect, useMemo, useState } from 'react';
import {
  getSpecificationRecordsForGrade, getSpecificationSourceUrl, isUsableSpecificationRecord,
  BIOLOGY_SPECIFICATION_TOPICS,
  getSpecificationContentLabel, getSpecificationSourceLabel, getSpecificationRecordById,
} from '../../data/biologySpecification/catalog';
import type { BiologySpecificationRecord } from '../../data/biologySpecification/types';
import { CompetencyDetails } from './CompetencyDetails';
import { getCompetencySpecification } from '../../data/biologySpecification/competencyMappings';

const levelLabel = { know: 'Nhận biết', understand: 'Thông hiểu', apply: 'Vận dụng' };
export const SpecificationCatalog: React.FC<{
  grade: 10 | 11 | 12;
  isEnglish: boolean;
  onAdd: (record: BiologySpecificationRecord) => void;
}> = ({ grade, isEnglish, onAdd }) => {
  const [query, setQuery] = useState('');
  const [contentId, setContentId] = useState('');
  const [showSourceIssues, setShowSourceIssues] = useState(false);
  const [scope, setScope] = useState('all');
  useEffect(() => { setContentId(''); }, [grade]);
  const records = useMemo(() => getSpecificationRecordsForGrade(grade), [grade]);
  const usable = records.filter(isUsableSpecificationRecord);
  const scopedRecords = records.filter(record => scope === 'all' || record.scope === scope);
  const contents = Array.from(new Map(scopedRecords.map(record => [record.contentId, getSpecificationContentLabel(record)])).entries());
  const matches = scopedRecords.filter(record => (!contentId || record.contentId === contentId)
    && (showSourceIssues || isUsableSpecificationRecord(record))
    && `${record.text} ${record.competencyCode || ''} ${record.contentLabel} ${getCompetencySpecification(record.id, record.competencyCode).descriptors.map(item => `${item.code} ${item.title} ${item.description}`).join(' ')}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')));
  return (
    <details className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <summary className="cursor-pointer text-sm font-bold text-slate-800 dark:text-white">
        {isEnglish ? 'Source specification' : 'Tra cứu bản đặc tả'} · {usable.length} YCCĐ · {isEnglish ? 'Grade' : 'Lớp'} {grade}
      </summary>
      <p className="my-3 text-xs leading-relaxed text-slate-500">
        {isEnglish ? 'Question addresses are source examples. Set exam counts and points yourself. Empty codes/levels and incomplete source text are shown explicitly.'
          : 'Địa chỉ câu/ý hỏi là thông tin minh hoạ trong nguồn. Hãy tự thiết lập số câu và điểm. Ô thiếu mã, mức độ và đoạn bị đứt được ghi rõ.'}
      </p>
      <p className="mb-3 rounded-lg bg-sky-50 p-3 text-xs text-sky-800 dark:bg-sky-950/30 dark:text-sky-200">
        {isEnglish ? 'Missing outcomes and elective modules are supplemented from the 2018 Biology curriculum. Source codes and cognitive levels remain blank where absent; set your own allocations.'
          : 'Đã bổ sung YCCĐ còn thiếu và chuyên đề lựa chọn từ CTGDPT Sinh học 2018. Chương trình không ghi mã năng lực hay mức độ; hãy phân bổ theo đề đang thiết kế.'}
        {grade === 12 && (isEnglish ? ' The missing ecosystem section and community practical now have complete curriculum references.' : ' Phần Hệ sinh thái và thực hành Quần xã bị thiếu ở bản đặc tả đã có nội dung đầy đủ từ chương trình.')}
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        <select aria-label={isEnglish ? 'Curriculum scope' : 'Phạm vi chương trình'} value={scope}
          onChange={event => { setScope(event.target.value); setContentId(''); }}
          className="max-w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
          <option value="all">{isEnglish ? 'Core and electives' : 'Nội dung chính và chuyên đề'}</option>
          <option value="core">{isEnglish ? 'Core curriculum' : 'Nội dung chính'}</option>
          <option value="elective">{isEnglish ? 'Elective modules' : 'Chuyên đề lựa chọn'}</option>
        </select>
        <input aria-label={isEnglish ? 'Search specification' : 'Tìm YCCĐ'} value={query} onChange={event => setQuery(event.target.value)}
          placeholder={isEnglish ? 'Search outcomes or codes' : 'Tìm theo YCCĐ hoặc mã năng lực'}
          className="min-w-64 flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700" />
        <select aria-label={isEnglish ? 'Specification topic' : 'Chủ đề đặc tả'} value={contentId} onChange={event => setContentId(event.target.value)}
          className="max-w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
          <option value="">{isEnglish ? 'All topics' : 'Tất cả chủ đề'}</option>
          {contents.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </div>
      {contentId && <p className="mb-3 text-xs leading-relaxed text-slate-500">
        {BIOLOGY_SPECIFICATION_TOPICS.find(topic => topic.grade === grade && topic.contentId === contentId)?.outline.join(' · ')}
      </p>}
      <label className="flex items-center gap-2 text-xs text-slate-500">
        <input type="checkbox" checked={showSourceIssues} onChange={event => setShowSourceIssues(event.target.checked)} />
        {isEnglish ? 'Include duplicate, empty and incomplete source rows' : 'Xem cả hàng trùng, ô “Ko có.” và mảnh câu chưa đủ'}
      </label>
      <p className="my-2 text-xs text-slate-500">{matches.length} {isEnglish ? 'matching source rows' : 'hàng nguồn phù hợp'}</p>
      <div className="max-h-[520px] space-y-2 overflow-y-auto">
        {matches.map(record => <article key={record.id} className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold">{getSpecificationContentLabel(record)} · {record.competencyCode || (isEnglish ? 'Code absent' : 'Nguồn không ghi mã')} · {record.level ? levelLabel[record.level] : (isEnglish ? 'Level absent' : 'Nguồn không ghi mức độ')}</span>
            <a className="text-sky-700 underline dark:text-sky-300" href={getSpecificationSourceUrl(record.sourcePage, record.sourceId)} target="_blank" rel="noreferrer">
              {getSpecificationSourceLabel(record.sourceId)} · {isEnglish ? 'Page' : 'Trang'} {(record.sourcePages || [record.sourcePage]).join(', ')}
            </a>
          </div>
          <p className="my-2 text-sm leading-relaxed">{record.text}</p>
          {isUsableSpecificationRecord(record) && <CompetencyDetails outcomeId={record.id} sourceCode={record.competencyCode} isEnglish={isEnglish} />}
          {record.relatedSourceRecordIds?.map(id => <a key={id} href={getSpecificationSourceUrl(getSpecificationRecordById(id)!.sourcePage)}
            target="_blank" rel="noreferrer" className="mb-2 block text-xs text-sky-700 underline dark:text-sky-300">
            {isEnglish ? 'Compare the incomplete specification fragment' : 'Đối chiếu mảnh câu bị thiếu trong bản đặc tả'}
          </a>)}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>{(['mcq', 'tf', 'short'] as const).map((part, index) => record.questionReferences?.[part] ? `${['I', 'II', 'III'][index]}: ${record.questionReferences[part]}` : '').filter(Boolean).join(' · ')}</span>
            {isUsableSpecificationRecord(record) && <button type="button" onClick={() => onAdd(record)}
              className="rounded-lg bg-sky-50 px-3 py-2 font-bold text-sky-700 dark:bg-sky-950/30 dark:text-sky-300">
              {isEnglish ? 'Add to blueprint' : 'Thêm vào ma trận'}
            </button>}
          </div>
          {(record.sourceDuplicate || record.sourceIncomplete || record.sourceEmpty || record.sourceNote) && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
            {[record.sourceDuplicate && (isEnglish ? 'Duplicate source row' : 'Hàng trùng trong nguồn'), record.sourceIncomplete && (isEnglish ? 'Incomplete source text' : 'Nguồn bị đứt đoạn'), record.sourceEmpty && (isEnglish ? 'No outcome in source' : 'Nguồn ghi không có YCCĐ'), record.sourceNote].filter(Boolean).join(' · ')}
          </p>}
        </article>)}
      </div>
    </details>
  );
};
