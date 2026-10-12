import React from 'react';
import { getCompetencySpecification } from '../../data/biologySpecification/competencyMappings';
import { getSpecificationSourceUrl } from '../../data/biologySpecification/catalog';

export const CompetencyDetails: React.FC<{ outcomeId: string; sourceCode: string | null; isEnglish: boolean }> = ({ outcomeId, sourceCode, isEnglish }) => {
  const specification = getCompetencySpecification(outcomeId, sourceCode);
  return <details className="mt-2 rounded-lg border border-sky-100 bg-sky-50/50 p-2 text-xs dark:border-sky-900 dark:bg-sky-950/20">
    <summary className="cursor-pointer font-semibold text-sky-800 dark:text-sky-200">
      {isEnglish ? 'Competency specification' : 'Đặc tả năng lực'}
      {specification.origin === 'source' && <span className="ml-2 font-normal">{sourceCode}</span>}
    </summary>
    {specification.origin === 'missing' && <p className="mt-2 text-amber-700 dark:text-amber-300">
      {isEnglish ? 'The source does not map this outcome to a competency code. No code is inferred.' : 'Nguồn chưa gán YCCĐ này cho mã năng lực. Không tự suy hoặc đề xuất mã thay nguồn.'}
    </p>}
    <ul className="mt-2 space-y-2">
      {specification.descriptors.map(item => <li key={item.code}>
        <strong>{item.code} · {item.title}</strong>
        <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-300">{item.description}</p>
        <a href={getSpecificationSourceUrl(item.sourcePages[0], 'curriculum')} target="_blank" rel="noreferrer" className="text-sky-700 underline dark:text-sky-300">
          CTGDPT 2018 · {isEnglish ? 'Pages' : 'Trang'} {item.sourcePages.join(', ')}
        </a>
      </li>)}
    </ul>
    {specification.status === 'partial' && <p className="mt-2 text-amber-700 dark:text-amber-300">
      {isEnglish ? 'Unresolved source notation' : 'Kí hiệu nguồn chưa giải thích đầy đủ'}: {specification.unresolvedTokens.join(', ')}.
      {' '}{isEnglish ? 'Only the known part is linked; confirm the suffix or subcode before assessment.' : 'Chỉ liên kết phần mã đã biết; cần xác nhận hậu tố hoặc mã thành phần trước khi đánh giá.'}
    </p>}
    <p className="mt-2 leading-relaxed text-slate-500">
      {isEnglish ? 'Descriptions follow curriculum section IV.2. NT/TH/VD numbering follows the app and specification convention; competency and cognitive level are separate.' : 'Biểu hiện theo mục IV.2 của chương trình; mã NT/TH/VD theo quy ước của ứng dụng và bản đặc tả. Năng lực và mức độ nhận thức là hai thông tin riêng.'}
    </p>
  </details>;
};
