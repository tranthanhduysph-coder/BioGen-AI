import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = resolve(root, 'data/biologySpecification');
const read = (path) => readFileSync(resolve(root, path));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const levels = { K: 'know', U: 'understand', A: 'apply', '?': null };
const records = [];
const topics = [];
const outlines = JSON.parse(read('data/biologySpecification/topicOutlines.json').toString('utf8'));
const pageOrdinals = new Map();
for (const grade of [10, 11, 12]) {
  let content;
  const lines = read(`data/biologySpecification/grade${grade}.psv`).toString('utf8').split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    if (!line.trim() || line.startsWith('#')) continue;
    if (line.startsWith('@')) {
      const [contentId, contentLabel, strand] = line.slice(1).split('|');
      if (!contentId || !contentLabel || !strand) throw new Error(`Invalid heading: ${line}`);
      content = { contentId, contentLabel, strand };
      if (!Array.isArray(outlines[grade]?.[contentId])) throw new Error(`Missing source outline: ${grade}/${contentId}`);
      topics.push({ grade, ...content, outline: outlines[grade][contentId], ...(contentId === 'ecosystems_biosphere' ? { sourceLabelInferred: true, sourceIncomplete: true } : {}) });
      continue;
    }
    const [levelKey, code, pageList, text, mcq = '', tf = '', short = '', flags = ''] = line.split('|');
    const pages = pageList?.split(',').map(Number);
    if (!content || !(levelKey in levels) || !text || !pages?.every(p => Number.isInteger(p) && p > 0 && p <= 33)) {
      throw new Error(`Invalid grade ${grade}, line ${index + 1}: ${line}`);
    }
    const page = pages[0];
    const ordinalKey = `${grade}-${page}`;
    const ordinal = (pageOrdinals.get(ordinalKey) || 0) + 1;
    pageOrdinals.set(ordinalKey, ordinal);
    records.push({
      id: `spec-g${grade}-p${String(page).padStart(2, '0')}-r${String(ordinal).padStart(2, '0')}`,
      grade, ...content, level: levels[levelKey], competencyCode: code || null, text,
      sourcePage: page, sourcePages: pages,
      sourceLocation: `grade${grade}.psv:${index + 1}`,
      questionReferences: { mcq, tf, short },
      ...(flags.includes('i') ? { sourceIncomplete: true } : {}),
      ...(flags.includes('e') ? { sourceEmpty: true } : {}),
      ...(!code && !flags.includes('e') ? { sourceCodeMissing: true } : {}),
      ...(levelKey === '?' ? { sourceLevelMissing: true } : {}),
    });
  }
}

// Page 28 repeats page 27. Keep every occurrence without adding duplicate menu entries.
const repeat = (record, page) => ({
  ...record, id: record.id.replace(/-p\d+-/, `-p${String(page).padStart(2, '0')}-`),
  sourcePage: page, sourcePages: [page], sourceLocation: `PDF:${page}`,
  sourceDuplicate: true, duplicateOf: record.id,
});
records.push(...records.filter(r => r.grade === 12 && r.contentId === 'evolution').map(r => repeat(r, 28)));
// The original PDF itself repeats grade 11 page 17 at page 31 inside grade 12.
const page31 = records.filter(r => r.grade === 11 && r.sourcePage === 17).map(r => {
  const copy = repeat(r, 31);
  copy.sourceNote = 'Trang 31 nằm trong phần lớp 12 nhưng lặp nội dung lớp 11 trang 17.';
  if (r.sourcePages.length > 1) {
    copy.text = 'Trình bày được một số yếu tố ảnh hưởng đến tuổi thọ của con';
    copy.sourceIncomplete = true;
  }
  return copy;
});
records.push(...page31);

const seen = new Map();
for (const record of records) {
  if (record.sourceDuplicate || record.sourceEmpty || record.sourceIncomplete) continue;
  const key = JSON.stringify([record.grade, record.contentId, record.level, record.competencyCode, record.text]);
  const prior = seen.get(key);
  if (prior) {
    record.sourceDuplicate = true;
    record.duplicateOf = prior.id;
  } else seen.set(key, record);
}
records.sort((a, b) => a.sourcePage - b.sourcePage || a.id.localeCompare(b.id));
const markdown = read('data/biologySpecification/source/biology-thpt.md');
const sourcePages = [...markdown.toString('utf8').matchAll(/^## Trang (\d+)\r?\n([\s\S]*?)(?=^## Trang |$(?![\s\S]))/gm)]
  .map(match => ({ page: Number(match[1]), rawMarkdown: match[2], sectionGrade: Number(match[1]) <= 8 ? 10 : Number(match[1]) <= 21 ? 11 : 12 }));
if (sourcePages.length !== 33) throw new Error('Expected all 33 Markdown pages');
const document = {
  schemaVersion: 1,
  source: {
    title: 'BẢN ĐẶC TẢ ĐỀ THEO YÊU CẦU CẦN ĐẠT CẤP THPT (LỚP 10-11-12)',
    pdfUrl: '/specification/biology-thpt.pdf', pageCount: 33,
    pdfSha256: sha256(read('public/specification/biology-thpt.pdf')),
    markdownSha256: sha256(markdown),
    transcription: 'Đối chiếu trực tiếp ảnh của toàn bộ 33 trang PDF; chỉ chuẩn hoá khoảng trắng, xuống dòng và dấu câu. Không suy mã năng lực từ động từ hoặc mức độ.',
    allocations: null, scores: null,
    notes: [
      'Cột Phần I/II/III ghi địa chỉ câu/ý hỏi minh hoạ; không phải số câu hay ma trận điểm.',
      'Trang 28 lặp trang 27. Trang 31 lặp nội dung lớp 11 trang 17 trong phần lớp 12.',
      'Phần đầu Hệ sinh thái và phần tiếp nối quần xã bị thiếu do trang 31 lặp. Giữ các mảnh câu chưa hoàn chỉnh, không dùng để tạo đề.',
      'Ô mức độ trống khi không có nhóm mức độ bao quanh được lưu null; ô mã trống được lưu null. Không tự bổ sung.',
    ],
  },
  topics, records, sourcePages,
};
const output = JSON.stringify(document, null, 2) + '\n';
const outputPath = resolve(dir, 'catalog.json');
if (process.argv.includes('--check')) {
  if (readFileSync(outputPath, 'utf8') !== output) throw new Error('Catalog is stale. Run npm run specification:ingest.');
} else writeFileSync(outputPath, output);
console.log(JSON.stringify({ records: records.length, grades: [10, 11, 12].map(grade => ({ grade, records: records.filter(r => r.grade === grade).length, usable: records.filter(r => r.grade === grade && !r.sourceDuplicate && !r.sourceEmpty && !r.sourceIncomplete).length })), pages: sourcePages.length }));
