export const parseMcqCorrectLetter = (answer: string) => {
  const match = answer.trim().match(/^([A-D])/i);
  return match ? match[1].toUpperCase() : null;
};

export const parseTrueFalseAnswerMap = (answer: string) => {
  const values = new Map<string, boolean>();

  answer
    .split(/[;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const match = part.match(/^([a-d])\s*[\)\.:\-]?\s*(Đúng|Dung|Sai|True|False|T|F)\b/i);
      if (!match) return;

      const letter = match[1].toLowerCase();
      const token = match[2].toLowerCase();
      const isTrue = ['đúng', 'dung', 'true', 't'].includes(token);
      values.set(letter, isTrue);
    });

  return values;
};

export const getTrueStatementLetters = (answer: string) => {
  const values = parseTrueFalseAnswerMap(answer);
  return new Set(
    [...values.entries()]
      .filter(([, isTrue]) => isTrue)
      .map(([letter]) => letter),
  );
};

export const normalizeMixerShortAnswer = (answer: string) =>
  answer
    .replace(/^\s*A\.\s*/i, '')
    .trim()
    .replace('.', ',');

export const isValidMixerShortAnswer = (answer: string) => {
  const normalized = normalizeMixerShortAnswer(answer);
  return /^-?\d+(?:,\d+)?$/.test(normalized) && normalized.length <= 4;
};
