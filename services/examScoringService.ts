import type { ExamBlueprint } from '../types/examBlueprint';

export type TrueFalseCorrectCount = 1 | 2 | 3 | 4;

export const getTrueFalseMaxScorePerQuestion = (blueprint: ExamBlueprint) => {
  const { questionCount, totalScore } = blueprint.scores.tf;
  return questionCount > 0 ? totalScore / questionCount : 0;
};

export const getTrueFalsePercentage = (
  blueprint: ExamBlueprint,
  correctCount: TrueFalseCorrectCount,
) => {
  const key = `correct${correctCount}` as const;
  return blueprint.scores.tf.scoreLevels[key];
};

export const getTrueFalseEarnedScore = (
  blueprint: ExamBlueprint,
  correctCount: TrueFalseCorrectCount,
) => {
  const maxScore = getTrueFalseMaxScorePerQuestion(blueprint);
  const percentage = getTrueFalsePercentage(blueprint, correctCount);
  return maxScore * (percentage / 100);
};

export const getTrueFalseScoreRows = (blueprint: ExamBlueprint) =>
  ([1, 2, 3, 4] as TrueFalseCorrectCount[]).map((correctCount) => ({
    correctCount,
    percentage: getTrueFalsePercentage(blueprint, correctCount),
    score: getTrueFalseEarnedScore(blueprint, correctCount),
  }));
