import { auth } from '../firebaseConfig';
import { requestAiJson } from './aiRequestService';
import type { Criteria, GeneratedQuestion } from '../types';
import { generatePrompt } from './geminiService';

const apiBase = () => {
  const value = (import.meta as any).env?.VITE_API_BASE_URL || '';
  return String(value).replace(/\/$/, '');
};

const requireIdToken = async (lang: string) => {
  const currentUser = auth?.currentUser;
  if (!currentUser) {
    throw new Error(
      lang === 'en'
        ? 'Sign in with a real Firebase account before using AI generation.'
        : 'Hãy đăng nhập bằng tài khoản Firebase thật trước khi tạo câu hỏi bằng AI.',
    );
  }
  return currentUser.getIdToken();
};

const generateCriteriaBatch = async (
  criteria: Criteria,
  lang: string,
  idToken: string,
): Promise<GeneratedQuestion[]> => {
  const base = apiBase();
  if (!base) {
    throw new Error(
      lang === 'en'
        ? 'BioGen backend API is not configured.'
        : 'Backend BioGen chưa được cấu hình.',
    );
  }

  const data = await requestAiJson<GeneratedQuestion[]>(`${base}/api/questions/generate-manual`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      prompt: generatePrompt(criteria, lang),
      expectedCount: criteria.questionCount,
      lang,
    }),
  }, lang);

  if (!Array.isArray(data)) {
    throw new Error(
      lang === 'en'
        ? 'BioGen backend returned invalid question data.'
        : 'Backend BioGen trả về dữ liệu câu hỏi không hợp lệ.',
    );
  }

  return data.map((question) => ({
    ...(question as GeneratedQuestion),
    criteria,
  }));
};

export const generateManualQuestions = async (
  criteriaList: Criteria[],
  lang: string = 'vi',
): Promise<GeneratedQuestion[]> => {
  if (criteriaList.length === 0) return [];

  const idToken = await requireIdToken(lang);
  const results: GeneratedQuestion[] = [];
  for (const criteria of criteriaList) {
    results.push(...await generateCriteriaBatch(criteria, lang, idToken));
  }
  return results;
};
