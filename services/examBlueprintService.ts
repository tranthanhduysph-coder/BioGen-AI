import { BIOLOGY_10_OUTCOMES } from '../data/biologySpecification';
import type {
  BlueprintRow,
  CognitiveLevel,
  ExamBlueprint,
  ExamPartKey,
} from '../types/examBlueprint';
import type {
  ExamQuestionSlot,
  ExamSlotPackage,
  TrueFalseQuestionSlot,
  TrueFalseStatementSlot,
} from '../types/examSlots';

const levelOrder: CognitiveLevel[] = ['know', 'understand', 'apply'];

const getOutcome = (outcomeId: string) =>
  BIOLOGY_10_OUTCOMES.find((outcome) => outcome.id === outcomeId);

const questionScore = (totalScore: number, questionCount: number) =>
  questionCount > 0 ? totalScore / questionCount : 0;

const expandSimplePart = (
  blueprint: ExamBlueprint,
  part: Exclude<ExamPartKey, 'tf'>,
): ExamQuestionSlot[] => {
  const slots: ExamQuestionSlot[] = [];
  let order = 1;
  const score = questionScore(
    blueprint.scores[part].totalScore,
    blueprint.scores[part].questionCount,
  );

  blueprint.rows.forEach((row: BlueprintRow) => {
    const outcome = getOutcome(row.outcomeId);
    if (!outcome) return;

    levelOrder.forEach((level) => {
      const count = Math.max(0, Math.floor(row.allocations[part][level] || 0));
      for (let index = 0; index < count; index += 1) {
        slots.push({
          id: `${part}-q${String(order).padStart(2, '0')}`,
          part,
          order,
          maxScore: score,
          contentId: row.contentId,
          contentLabel: outcome.contentLabel,
          competencyCode: row.competencyCode,
          outcomeId: row.outcomeId,
          outcomeText: outcome.text,
          level,
        });
        order += 1;
      }
    });
  });

  return slots;
};

const expandTrueFalseStatements = (blueprint: ExamBlueprint): TrueFalseStatementSlot[] => {
  const statements: TrueFalseStatementSlot[] = [];

  blueprint.rows.forEach((row) => {
    const outcome = getOutcome(row.outcomeId);
    if (!outcome) return;

    levelOrder.forEach((level) => {
      const count = Math.max(0, Math.floor(row.allocations.tf[level] || 0));
      for (let index = 0; index < count; index += 1) {
        statements.push({
          id: `tf-s${String(statements.length + 1).padStart(2, '0')}`,
          statementOrder: 1,
          contentId: row.contentId,
          contentLabel: outcome.contentLabel,
          competencyCode: row.competencyCode,
          outcomeId: row.outcomeId,
          outcomeText: outcome.text,
          level,
        });
      }
    });
  });

  return statements;
};

const groupTrueFalseQuestions = (blueprint: ExamBlueprint): TrueFalseQuestionSlot[] => {
  const statements = expandTrueFalseStatements(blueprint);
  const score = questionScore(
    blueprint.scores.tf.totalScore,
    blueprint.scores.tf.questionCount,
  );

  const questions: TrueFalseQuestionSlot[] = [];

  for (let offset = 0; offset < statements.length; offset += 4) {
    const group = statements.slice(offset, offset + 4).map((statement, index) => ({
      ...statement,
      statementOrder: (index + 1) as 1 | 2 | 3 | 4,
    }));

    if (group.length < 4) break;

    const order = questions.length + 1;
    questions.push({
      id: `tf-q${String(order).padStart(2, '0')}`,
      part: 'tf',
      order,
      maxScore: score,
      statements: group,
      scoring: { ...blueprint.scores.tf.scoreLevels },
    });
  }

  return questions;
};

export const buildExamSlots = (blueprint: ExamBlueprint): ExamSlotPackage => ({
  mcq: expandSimplePart(blueprint, 'mcq'),
  tf: groupTrueFalseQuestions(blueprint),
  short: expandSimplePart(blueprint, 'short'),
});

export const validateExamSlots = (blueprint: ExamBlueprint, slots: ExamSlotPackage) => {
  const issues: string[] = [];

  if (slots.mcq.length !== blueprint.scores.mcq.questionCount) {
    issues.push(
      `Phần I: có ${slots.mcq.length}/${blueprint.scores.mcq.questionCount} câu.`,
    );
  }

  if (slots.tf.length !== blueprint.scores.tf.questionCount) {
    issues.push(
      `Phần II: có ${slots.tf.length}/${blueprint.scores.tf.questionCount} câu Đúng/Sai.`,
    );
  }

  if (slots.short.length !== blueprint.scores.short.questionCount) {
    issues.push(
      `Phần III: có ${slots.short.length}/${blueprint.scores.short.questionCount} câu.`,
    );
  }

  slots.tf.forEach((question) => {
    if (question.statements.length !== 4) {
      issues.push(`Phần II câu ${question.order}: chưa đủ 4 ý.`);
    }
  });

  return {
    valid: issues.length === 0,
    issues,
  };
};
