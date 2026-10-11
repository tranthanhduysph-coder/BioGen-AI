import React, { useEffect, useMemo, useState } from 'react';
import {
  getSpecificationRecordsForGrade, getSpecificationSourceUrl, isUsableSpecificationRecord,
  BIOLOGY_SPECIFICATION_TOPICS,
} from '../../data/biologySpecification/catalog';
import type { BiologySpecificationRecord } from '../../data/biologySpecification/types';

const levelLabel = { know: 'Nhận biết', understand: 'Thông hiểu', apply: 'Vận dụng' };
export const SpecificationCatalog: React.FC<{
  grade: 10 | 11 | 12;
  isEnglish: boolean;
  onAdd: (record: BiologySpecificationRecord) => void;
}> = ({ grade, isEnglish, onAdd }) => {
  const [query, setQuery] = useState('');
  const [contentId, setContentId] = useState('');
  const [showSourceIssues, setShowSourceIssues] = useState(false);
  useEffect(() => { setContentId(''); }, [grade]);
  const records = useMemo(() => getSpecificationRecordsForGrade(grade), [grade]);
  const usable = records.filter(isUsableSpecificationRecord);
  const contents = Array.from(new Map(records.map(record => [record.contentId, record.contentLabel])).entries());
  const matches = records.filter(record => (!contentId || record.contentId === contentId)
    && (showSourceIssues || isUsableSpecificationRecord(record))
    && `${record.text} ${record.competencyCode || ''} ${record.contentLabel}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')));
  return (
    <details className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <summary className="cursor-pointer text-sm font-bold text-slate-800 dark:text-white">
        {isEnglish ? 'Source specification' : 'Tra cứu bản đặc tả'} · {usable.length} YCCĐ · {isEnglish ? 'Grade' : 'Lớp'} {grade}
      </summary>
      <p className="my-3 text-xs leading-relaxed text-slate-500">
        {isEnglish ? 'Question addresses are source examples. Set exam counts and points yourself. Empty codes/levels and incomplete source text are shown explicitly.'
          : 'Địa chỉ câu/ý hỏi là thông tin minh hoạ trong nguồn. Hãy tự thiết lập số câu và điểm. Ô thiếu mã, mức độ và đoạn bị đứt được ghi rõ.'}
      </p>
      {grade === 12 && <p className="mb-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
        {isEnglish ? 'The original PDF repeats grade 11 content on page 31; the start of the ecosystem section and a community outcome continuation are missing.'
          : 'PDF gốc lặp nội dung lớp 11 ở trang 31; thiếu phần đầu Hệ sinh thái và đoạn tiếp nối một YCCĐ Quần xã. Các mảnh câu chưa đủ không được dùng để tạo đề.'}
      </p>}
      <div className="mb-3 flex flex-wrap gap-2">
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
            <span className="font-bold">{record.contentLabel} · {record.competencyCode || (isEnglish ? 'Code absent' : 'Nguồn không ghi mã')} · {record.level ? levelLabel[record.level] : (isEnglish ? 'Level absent' : 'Nguồn không ghi mức độ')}</span>
            <a className="text-sky-700 underline dark:text-sky-300" href={getSpecificationSourceUrl(record.sourcePage)} target="_blank" rel="noreferrer">
              PDF · {isEnglish ? 'Page' : 'Trang'} {(record.sourcePages || [record.sourcePage]).join(', ')}
            </a>
          </div>
          <p className="my-2 text-sm leading-relaxed">{record.text}</p>
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
