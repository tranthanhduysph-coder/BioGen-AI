import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  TextRun,
  TabStopType,
} from 'docx';
import saveAs from 'file-saver';
import type { ExamBlueprint } from '../types/examBlueprint';
import type { GeneratedExamItem } from '../types/generatedExam';
import {
  getTrueStatementLetters,
  normalizeMixerShortAnswer,
  parseMcqCorrectLetter,
} from './examMixerFormatService';

const A4 = { width: 11906, height: 16838 };
const CM = 567;

const baseRun = (
  text: string,
  options: { bold?: boolean; underline?: boolean; size?: number } = {},
) =>
  new TextRun({
    text,
    font: 'Times New Roman',
    size: options.size ?? 24,
    bold: options.bold,
    underline: options.underline ? {} : undefined,
  });

const paragraph = (
  children: TextRun[],
  options: {
    before?: number;
    after?: number;
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    tabStops?: number[];
    line?: number;
  } = {},
) =>
  new Paragraph({
    children,
    alignment: options.alignment,
    tabStops: options.tabStops?.map((position) => ({
      type: TabStopType.LEFT,
      position,
    })),
    spacing: {
      before: options.before ?? 0,
      after: options.after ?? 0,
      line: options.line ?? 240,
    },
  });

const stripOptionLabel = (value: string, fallback: string) =>
  value.replace(new RegExp(`^\\s*${fallback}[\\.\\)]\\s*`, 'i'), '').trim();

const optionRuns = (
  letter: string,
  text: string,
  correct: boolean,
  prefix = '',
) => [
  baseRun(prefix, { bold: true }),
  baseRun(letter, { bold: true, underline: correct }),
  baseRun('. ', { bold: true }),
  baseRun(text),
];

const TAB_4 = [283, 2906, 5528, 8150];
const TAB_2 = [283, 5528];
const TAB_1 = [283];

const mcqOptionParagraphs = (item: GeneratedExamItem) => {
  const labels = ['A', 'B', 'C', 'D'];
  const correct = parseMcqCorrectLetter(item.question.answer);
  const options = labels.map((label, index) => ({
    label,
    text: stripOptionLabel(item.question.options[index] || '', label),
  }));

  const longest = Math.max(...options.map((option) => option.text.length), 0);

  if (longest <= 28) {
    const runs: TextRun[] = [];
    options.forEach((option, index) => {
      runs.push(...optionRuns(option.label, option.text, correct === option.label, index === 0 ? '' : '\t'));
    });
    return [paragraph(runs, { after: 0, tabStops: TAB_4 })];
  }

  if (longest <= 58) {
    return [
      paragraph([
        ...optionRuns('A', options[0].text, correct === 'A'),
        ...optionRuns('B', options[1].text, correct === 'B', '\t'),
      ], { tabStops: TAB_2 }),
      paragraph([
        ...optionRuns('C', options[2].text, correct === 'C'),
        ...optionRuns('D', options[3].text, correct === 'D', '\t'),
      ], { tabStops: TAB_2 }),
    ];
  }

  return options.map((option) =>
    paragraph(
      optionRuns(option.label, option.text, correct === option.label),
      { tabStops: TAB_1 },
    ),
  );
};

const buildMixReadyExamChildren = (items: GeneratedExamItem[]) => {
  const children: Paragraph[] = [];
  const part1 = items.filter((item) => item.part === 'mcq').sort((a, b) => a.order - b.order);
  const part2 = items.filter((item) => item.part === 'tf').sort((a, b) => a.order - b.order);
  const part3 = items.filter((item) => item.part === 'short').sort((a, b) => a.order - b.order);

  if (part1.length > 0) {
    children.push(
      paragraph([
        baseRun('PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn. ', { bold: true }),
        baseRun(`Thí sinh trả lời từ câu 1 đến câu ${part1.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.`),
      ], { after: 0 }),
    );

    part1.forEach((item) => {
      children.push(
        paragraph([
          baseRun(`Câu ${item.order}. `, { bold: true }),
          baseRun(item.question.question),
        ]),
      );
      children.push(...mcqOptionParagraphs(item));
    });
  }

  if (part2.length > 0) {
    children.push(
      paragraph([
        baseRun('PHẦN II. Câu trắc nghiệm đúng sai. ', { bold: true }),
        baseRun(`Thí sinh trả lời từ câu 1 đến câu ${part2.length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.`),
      ], { before: 100 }),
    );

    part2.forEach((item) => {
      const trueLetters = getTrueStatementLetters(item.question.answer);

      children.push(
        paragraph([
          baseRun(`Câu ${item.order}. `, { bold: true }),
          baseRun(item.question.question),
        ]),
      );

      ['a', 'b', 'c', 'd'].forEach((letter, index) => {
        const text = (item.question.options[index] || '')
          .replace(new RegExp(`^\\s*${letter}[\\)\\.]\\s*`, 'i'), '')
          .trim();

        children.push(
          paragraph([
            baseRun(letter, { bold: true, underline: trueLetters.has(letter) }),
            baseRun(') ', { bold: true }),
            baseRun(text),
          ], { tabStops: TAB_1 }),
        );
      });
    });
  }

  if (part3.length > 0) {
    children.push(
      paragraph([
        baseRun('PHẦN III. Câu trắc nghiệm trả lời ngắn. ', { bold: true }),
        baseRun(`Thí sinh trả lời từ câu 1 đến câu ${part3.length}.`),
      ], { before: 100 }),
    );

    part3.forEach((item) => {
      const answer = normalizeMixerShortAnswer(item.question.answer);
      if (!/^-?\d+(?:,\d+)?$/.test(answer) || answer.length > 4) {
        throw new Error(`Đáp án trả lời ngắn "${answer}" không đúng format số tối đa 4 ký tự.`);
      }

      children.push(
        paragraph([
          baseRun(`Câu ${item.order}. `, { bold: true }),
          baseRun(item.question.question),
        ]),
      );

      children.push(
        paragraph([
          baseRun('A.', { bold: true }),
          baseRun(` ${answer}`),
        ]),
      );
    });
  }

  return children;
};

export const exportMixReadyExamDocx = async (
  blueprint: ExamBlueprint,
  items: GeneratedExamItem[],
) => {
  if (items.length === 0) {
    throw new Error('Chưa có câu hỏi để xuất đề trộn.');
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
            spacing: {
              after: 0,
              line: 240,
            },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: A4,
            margin: {
              top: CM,
              right: CM,
              bottom: CM,
              left: CM * 2,
            },
          },
        },
        children: buildMixReadyExamChildren(items),
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `De_tron_Sinh_${blueprint.grade}_BioGen.docx`);
};
