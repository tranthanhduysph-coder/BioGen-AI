import {
  AlignmentType,
  BorderStyle,
  Document,
  PageOrientation,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import saveAs from 'file-saver';
import type { ExamBlueprint } from '../types/examBlueprint';
import type { GeneratedExamItem } from '../types/generatedExam';
import { getOutcomeById } from '../data/biologySpecification';
import { getTrueFalseMaxScorePerQuestion, getTrueFalseScoreRows } from './examScoringService';

const A4 = { width: 11906, height: 16838 };
const CM = 567;

const borders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: '808080' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '808080' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '808080' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '808080' },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'BFBFBF' },
  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'BFBFBF' },
};

const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

const run = (text: string, options: { bold?: boolean; size?: number; italics?: boolean; underline?: boolean } = {}) =>
  new TextRun({
    text,
    font: 'Times New Roman',
    size: options.size ?? 24,
    bold: options.bold,
    italics: options.italics,
    underline: options.underline ? {} : undefined,
  });

const p = (
  children: TextRun[],
  options: {
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    before?: number;
    after?: number;
    line?: number;
    pageBreakBefore?: boolean;
  } = {},
) =>
  new Paragraph({
    children,
    alignment: options.alignment,
    spacing: {
      before: options.before ?? 0,
      after: options.after ?? 0,
      line: options.line ?? 240,
    },
    pageBreakBefore: options.pageBreakBefore,
  });

const cell = (
  text: string,
  options: { bold?: boolean; size?: number; center?: boolean; width?: number } = {},
) =>
  new TableCell({
    width: options.width ? { size: options.width, type: WidthType.PERCENTAGE } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 70, right: 70 },
    children: [
      p(
        [run(text, { bold: options.bold, size: options.size ?? 18 })],
        { alignment: options.center === false ? AlignmentType.LEFT : AlignmentType.CENTER, line: 200 },
      ),
    ],
  });

const sumLevels = (row: ExamBlueprint['rows'][number], part: 'mcq' | 'tf' | 'short') =>
  row.allocations[part].know + row.allocations[part].understand + row.allocations[part].apply;

const createSetupTable = (blueprint: ExamBlueprint) => {
  const rows = [
    new TableRow({
      children: [
        cell('Phần', { bold: true, width: 34 }),
        cell('Số câu', { bold: true, width: 18 }),
        cell('Tổng điểm', { bold: true, width: 22 }),
        cell('Điểm/câu', { bold: true, width: 26 }),
      ],
    }),
  ];

  const defs: Array<{ label: string; key: 'mcq' | 'tf' | 'short' }> = [
    { label: 'I. Trắc nghiệm nhiều lựa chọn', key: 'mcq' },
    { label: 'II. Đúng/Sai', key: 'tf' },
    { label: 'III. Trả lời ngắn', key: 'short' },
  ];

  defs.forEach(({ label, key }) => {
    const config = blueprint.scores[key];
    const per = config.questionCount > 0 ? config.totalScore / config.questionCount : 0;
    rows.push(
      new TableRow({
        children: [
          cell(label, { center: false }),
          cell(String(config.questionCount)),
          cell(String(config.totalScore)),
          cell(per.toFixed(3).replace(/0+$/, '').replace(/\.$/, '').replace('.', ',')),
        ],
      }),
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
    borders,
  });
};

const createTfScoreTable = (blueprint: ExamBlueprint) => {
  const rows = getTrueFalseScoreRows(blueprint);
  const maxPerQuestion = getTrueFalseMaxScorePerQuestion(blueprint);
  const formatScore = (value: number) =>
    value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '').replace('.', ',');

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders,
    rows: [
      new TableRow({
        children: [
          cell('Số ý đúng trong 1 câu Đ/S', { bold: true, width: 40 }),
          cell('1/4', { bold: true, width: 15 }),
          cell('2/4', { bold: true, width: 15 }),
          cell('3/4', { bold: true, width: 15 }),
          cell('4/4', { bold: true, width: 15 }),
        ],
      }),
      new TableRow({
        children: [
          cell('Tỷ lệ điểm của câu', { bold: true }),
          ...rows.map((row) => cell(`${row.percentage}%`)),
        ],
      }),
      new TableRow({
        children: [
          cell(`Điểm thực nhận (câu tối đa ${formatScore(maxPerQuestion)} điểm)`, { bold: true }),
          ...rows.map((row) => cell(formatScore(row.score))),
        ],
      }),
    ],
  });
};

const createBlueprintTable = (blueprint: ExamBlueprint) => {
  const header1 = new TableRow({
    children: [
      cell('Nội dung / đơn vị kiến thức', { bold: true, width: 15 }),
      cell('Năng lực', { bold: true, width: 8 }),
      cell('Yêu cầu cần đạt', { bold: true, width: 25 }),
      cell('Phần I · MCQ', { bold: true, width: 15 }),
      cell('Phần II · Đ/S', { bold: true, width: 15 }),
      cell('Phần III · TL ngắn', { bold: true, width: 15 }),
      cell('Tổng', { bold: true, width: 7 }),
    ],
  });

  const rows: TableRow[] = [header1];

  rows.push(
    new TableRow({
      children: [
        cell('', { size: 16 }),
        cell('', { size: 16 }),
        cell('', { size: 16 }),
        cell('B     H     VD', { bold: true, size: 16 }),
        cell('B     H     VD', { bold: true, size: 16 }),
        cell('B     H     VD', { bold: true, size: 16 }),
        cell('', { size: 16 }),
      ],
    }),
  );

  blueprint.rows.forEach((row) => {
    const outcome = getOutcomeById(row.outcomeId);
    const outcomeText = outcome?.text || row.outcomeId;
    const contentLabel = outcome?.contentLabel || row.contentId;
    const formatAlloc = (part: 'mcq' | 'tf' | 'short') =>
      `${row.allocations[part].know}     ${row.allocations[part].understand}     ${row.allocations[part].apply}`;

    rows.push(
      new TableRow({
        children: [
          cell(contentLabel, { center: false, size: 16 }),
          cell(row.competencyCode, { size: 16 }),
          cell(outcomeText, { center: false, size: 16 }),
          cell(formatAlloc('mcq'), { size: 16 }),
          cell(formatAlloc('tf'), { size: 16 }),
          cell(formatAlloc('short'), { size: 16 }),
          cell(String(sumLevels(row, 'mcq') + sumLevels(row, 'tf') + sumLevels(row, 'short')), { size: 16 }),
        ],
      }),
    );
  });

  const totals = {
    mcq: { know: 0, understand: 0, apply: 0 },
    tf: { know: 0, understand: 0, apply: 0 },
    short: { know: 0, understand: 0, apply: 0 },
  };

  blueprint.rows.forEach((row) => {
    (['mcq', 'tf', 'short'] as const).forEach((part) => {
      totals[part].know += row.allocations[part].know;
      totals[part].understand += row.allocations[part].understand;
      totals[part].apply += row.allocations[part].apply;
    });
  });

  const totalAll =
    totals.mcq.know + totals.mcq.understand + totals.mcq.apply +
    totals.tf.know + totals.tf.understand + totals.tf.apply +
    totals.short.know + totals.short.understand + totals.short.apply;

  rows.push(
    new TableRow({
      children: [
        cell('TỔNG THEO CỘT', { bold: true, center: false, size: 16 }),
        cell('', { size: 16 }),
        cell('', { size: 16 }),
        cell(`${totals.mcq.know}     ${totals.mcq.understand}     ${totals.mcq.apply}`, { bold: true, size: 16 }),
        cell(`${totals.tf.know}     ${totals.tf.understand}     ${totals.tf.apply}`, { bold: true, size: 16 }),
        cell(`${totals.short.know}     ${totals.short.understand}     ${totals.short.apply}`, { bold: true, size: 16 }),
        cell(String(totalAll), { bold: true, size: 16 }),
      ],
    }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
    borders,
  });
};

const optionTable = (options: string[]) => {
  const normalized = options.slice(0, 4);
  const max = Math.max(...normalized.map((item) => item.length), 0);
  const perRow = max <= 34 ? 4 : max <= 70 ? 2 : 1;
  const rows: TableRow[] = [];

  for (let i = 0; i < normalized.length; i += perRow) {
    const chunk = normalized.slice(i, i + perRow);
    while (chunk.length < perRow) chunk.push('');
    rows.push(
      new TableRow({
        children: chunk.map((text) =>
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 30, bottom: 30, left: 40, right: 40 },
            children: [p([run(text, { size: 22 })], { line: 220 })],
          }),
        ),
      }),
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
    borders: noBorders,
  });
};

const buildExamChildren = (items: GeneratedExamItem[]) => {
  const children: Array<Paragraph | Table> = [];
  const part1 = items.filter((item) => item.part === 'mcq').sort((a, b) => a.order - b.order);
  const part2 = items.filter((item) => item.part === 'tf').sort((a, b) => a.order - b.order);
  const part3 = items.filter((item) => item.part === 'short').sort((a, b) => a.order - b.order);

  children.push(
    p([run('ĐỀ KIỂM TRA MÔN SINH HỌC', { bold: true, size: 28 })], {
      alignment: AlignmentType.CENTER,
      after: 80,
    }),
  );

  if (part1.length > 0) {
    children.push(
      p([
        run('PHẦN I. ', { bold: true }),
        run('Câu trắc nghiệm nhiều phương án lựa chọn. ', { bold: true }),
        run(`Thí sinh trả lời từ câu 1 đến câu ${part1.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.`),
      ], { before: 100, after: 40 }),
    );

    part1.forEach((item) => {
      children.push(
        p([
          run(`Câu ${item.order}: `, { bold: true }),
          run(item.question.question),
        ], { before: 70, after: 30 }),
      );
      children.push(optionTable(item.question.options));
    });
  }

  if (part2.length > 0) {
    children.push(
      p([
        run('PHẦN II. ', { bold: true }),
        run('Câu trắc nghiệm đúng sai. ', { bold: true }),
        run(`Thí sinh trả lời từ câu 1 đến câu ${part2.length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.`),
      ], { before: 160, after: 40 }),
    );

    part2.forEach((item) => {
      children.push(
        p([
          run(`Câu ${item.order}: `, { bold: true }),
          run(item.question.question),
        ], { before: 70, after: 30 }),
      );
      item.question.options.forEach((option) => {
        children.push(p([run(option)], { after: 20, line: 220 }));
      });
    });
  }

  if (part3.length > 0) {
    children.push(
      p([
        run('PHẦN III. ', { bold: true }),
        run('Câu trắc nghiệm trả lời ngắn. ', { bold: true }),
        run(`Thí sinh trả lời từ câu 1 đến câu ${part3.length}.`),
      ], { before: 160, after: 40 }),
    );

    part3.forEach((item) => {
      children.push(
        p([
          run(`Câu ${item.order}: `, { bold: true }),
          run(item.question.question),
        ], { before: 70, after: 20 }),
      );
      children.push(p([run('Trả lời: ............................................................')], { after: 30 }));
    });
  }

  return children;
};

const buildAnswerChildren = (blueprint: ExamBlueprint, items: GeneratedExamItem[]) => {
  const children: Array<Paragraph | Table> = [
    p([run('ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM', { bold: true, size: 28 })], {
      alignment: AlignmentType.CENTER,
      after: 120,
    }),
  ];

  (['mcq', 'tf', 'short'] as const).forEach((part) => {
    const partItems = items.filter((item) => item.part === part).sort((a, b) => a.order - b.order);
    if (partItems.length === 0) return;

    const title = part === 'mcq' ? 'PHẦN I' : part === 'tf' ? 'PHẦN II' : 'PHẦN III';
    children.push(p([run(title, { bold: true })], { before: 100, after: 50 }));

    partItems.forEach((item) => {
      children.push(
        p([
          run(`Câu ${item.order}: `, { bold: true }),
          run(item.question.answer, { bold: true, underline: true }),
        ], { after: 20 }),
      );
      if (item.question.explanation) {
        children.push(p([run(`Giải thích: ${item.question.explanation}`, { italics: true, size: 20 })], { after: 50 }));
      }
    });
  });

  children.push(p([run('THANG ĐIỂM PHẦN II – ĐÚNG/SAI', { bold: true })], { before: 140, after: 50 }));
  children.push(createTfScoreTable(blueprint));

  return children;
};

export const exportExamPackageDocx = async (
  blueprint: ExamBlueprint,
  items: GeneratedExamItem[] = [],
) => {
  const totalScore =
    blueprint.scores.mcq.totalScore +
    blueprint.scores.tf.totalScore +
    blueprint.scores.short.totalScore;

  const matrixChildren: Array<Paragraph | Table> = [
    p([run('MA TRẬN VÀ BẢN ĐẶC TẢ ĐỀ KIỂM TRA', { bold: true, size: 28 })], {
      alignment: AlignmentType.CENTER,
      after: 50,
    }),
    p([run(blueprint.title, { bold: true })], {
      alignment: AlignmentType.CENTER,
      after: 20,
    }),
    p([
      run(`Lớp ${blueprint.grade} · Thời gian: ${blueprint.durationMinutes} phút · Tổng điểm: ${totalScore}`),
    ], {
      alignment: AlignmentType.CENTER,
      after: 100,
    }),
    createSetupTable(blueprint),
    p([run('Thang điểm câu Đúng/Sai', { bold: true })], { before: 100, after: 40 }),
    createTfScoreTable(blueprint),
    p([run('Bảng đặc tả + ma trận', { bold: true })], { before: 100, after: 40 }),
    createBlueprintTable(blueprint),
  ];

  const sections: any[] = [
    {
      properties: {
        page: {
          size: { width: A4.height, height: A4.width, orientation: PageOrientation.LANDSCAPE },
          margin: { top: CM, right: CM, bottom: CM, left: CM },
        },
      },
      children: matrixChildren,
    },
  ];

  if (items.length > 0) {
    sections.push({
      properties: {
        page: {
          size: A4,
          margin: { top: CM, right: CM, bottom: CM, left: CM * 2 },
        },
      },
      children: [
        p([run(blueprint.title, { bold: true, size: 26 })], {
          alignment: AlignmentType.CENTER,
          after: 20,
        }),
        p([run(`MÔN: SINH HỌC · LỚP ${blueprint.grade}`, { bold: true })], {
          alignment: AlignmentType.CENTER,
          after: 20,
        }),
        p([run(`Thời gian làm bài: ${blueprint.durationMinutes} phút`)], {
          alignment: AlignmentType.CENTER,
          after: 100,
        }),
        ...buildExamChildren(items),
      ],
    });

    sections.push({
      properties: {
        page: {
          size: A4,
          margin: { top: CM, right: CM, bottom: CM, left: CM * 2 },
        },
      },
      children: buildAnswerChildren(blueprint, items),
    });
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Times New Roman',
            size: 24,
          },
          paragraph: {
            spacing: { after: 0, line: 240 },
          },
        },
      },
    },
    sections,
  });

  const blob = await Packer.toBlob(doc);
  const suffix = items.length > 0 ? 'Bo_de' : 'Ma_tran_Dac_ta';
  saveAs(blob, `${suffix}_Sinh_${blueprint.grade}_BioGen.docx`);
};
