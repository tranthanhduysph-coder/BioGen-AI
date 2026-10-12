import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

mkdirSync('tmp/audit', { recursive: true });
const target = resolve('tmp/audit/content-competencies.mjs');
await build({ stdin: { contents: "export * from './data/biologySpecification';", resolveDir: process.cwd(), loader: 'ts' }, outfile: target, bundle: true, platform: 'node', format: 'esm' });
const api = await import(pathToFileURL(target).href);
const esc = value => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
const pdfLink = (pages, source = 'curriculum') => `[${pages.join(', ')}](https://biogenai-blueprint-preview.onrender.com/specification/${source === 'curriculum' ? 'biology-curriculum-2018.pdf' : 'biology-thpt.pdf'}#page=${pages[0]})`;
const lines = [
  '# Đối chiếu nội dung – năng lực – YCCĐ Sinh học THPT', '',
  'Đối chiếu 511 YCCĐ của 55 nội dung/chuyên đề lớp 10–11–12. Mã năng lực là mã in trong bản đặc tả; liên kết CTGDPT 2018 chỉ xác nhận YCCĐ chương trình, không chứng nhận một phép gán mã năng lực mới.', '',
  '504 yêu cầu khớp câu hoặc vế câu sau chuẩn hoá khoảng trắng/dấu câu; 7 trường hợp khác diễn đạt/chính tả/chỉ số đã được kiểm tra trên ảnh PDF và ghi rõ dưới đây. Một YCCĐ chương trình có thể được bảng đặc tả tách thành nhiều vế.', '',
  '87 YCCĐ chưa có mã nguồn được giữ riêng. Không sử dụng mã đề xuất. NT2-NT4 liên kết NT2 và NT4, không thêm NT3. NT5-H và VD/NT5 giữ cảnh báo phần kí hiệu chưa xác định. Mã ghép được tra cứu dưới từng mã thành phần đã xác định; một yêu cầu có thể xuất hiện trong hai nhóm.', '',
  '## Tổng hợp từng nội dung', '',
  '| Lớp | Nội dung | Tổng YCCĐ | Năng lực có YCCĐ trong nguồn (số YCCĐ) | Chưa gán mã |',
  '| --- | --- | ---: | --- | ---: |',
];
const topics = [];
for (const grade of [10, 11, 12]) for (const content of api.getContentsForGrade(grade)) {
  const outcomes = api.getOutcomesForGrade(grade).filter(row => row.contentId === content.id);
  const codes = api.getCompetenciesForContent(grade, content.id);
  topics.push({ grade, content, outcomes, codes });
  const summary = codes.filter(row => row.code).map(row => `${row.code}: ${api.getOutcomesForSelection(grade, content.id, row.code).length}`).join('; ') || 'Nguồn chưa gán năng lực';
  lines.push(`| ${grade} | ${esc(content.label)} | ${outcomes.length} | ${summary} | ${outcomes.filter(row => !row.competencyCode).length} |`);
}
for (const { grade, content, outcomes, codes } of topics) {
  lines.push('', `## Lớp ${grade} · ${content.label}`, '');
  for (const { code } of codes) {
    const selected = api.getOutcomesForSelection(grade, content.id, code);
    lines.push(`### ${code || 'Nguồn chưa gán mã'} · ${selected.length} YCCĐ`, '');
    if (code) lines.push(api.getCompetencyDescription(code), '');
    else lines.push('Không có phép gán năng lực chính thức trong nguồn cho các yêu cầu sau.', '');
    lines.push('| Mã gốc | YCCĐ theo nguồn | Trang nguồn | Trang YCCĐ chương trình |', '| --- | --- | --- | --- |');
    for (const row of selected) {
      const reference = row.curriculumAlignment;
      lines.push(`| ${row.competencyCode || 'Trống'} | ${esc(row.text)} | ${pdfLink(row.sourcePages, row.sourceId || 'specification')} | ${pdfLink(reference.pages)} |`);
    }
  }
  const variants = outcomes.filter(row => row.curriculumAlignment.status === 'source_variant');
  for (const row of variants) lines.push('', `**Khác biệt nguồn:** ${row.curriculumAlignment.note}`, '', `YCCĐ trong chương trình: ${row.curriculumAlignment.curriculumText}`, '');
}
writeFileSync('docs/content-competency-audit.md', lines.join('\n') + '\n');
console.log(JSON.stringify({ topics: topics.length, outcomes: api.BIOLOGY_OUTCOMES.length, missingCodes: api.BIOLOGY_OUTCOMES.filter(row => !row.competencyCode).length, report: 'docs/content-competency-audit.md' }));
