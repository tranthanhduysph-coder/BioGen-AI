import { auth } from '../firebaseConfig';
import type { Criteria, GeneratedQuestion } from '../types';
import { generatePrompt } from './geminiService';

const apiBase = () => {
  const value = (import.meta as any).env?.VITE_API_BASE_URL || '';
  return String(value).replace(/\/$/, '');
};

const parseError = async (response: Response) => {
  try {
    const data = await response.json();
    if (typeof data?.detail === 'string') return data.detail;
    return JSON.stringify(data);
  } catch {
    return response.statusText || 'BioGen backend request failed.';
  }
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

  const response = await fetch(`${base}/api/questions/generate-manual`, {
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
  });

  if (!response.ok) {
    const detail = await parseError(response);

    if (response.status === 401) {
      throw new Error(
        lang === 'en'
          ? 'Your login session is invalid or expired. Sign in again.'
          : 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Hãy đăng nhập lại.',
      );
    }

    if (response.status === 503) {
      throw new Error(
        lang === 'en'
          ? 'The BioGen backend is online, but GEMINI_API_KEY has not been configured yet.'
          : 'Backend BioGen đang hoạt động nhưng chưa được cấu hình GEMINI_API_KEY.',
      );
    }

    throw new Error(detail);
  }

  const data = await response.json();
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
  const results = await Promise.all(
    criteriaList.map((criteria) => generateCriteriaBatch(criteria, lang, idToken)),
  );

  return results.flat();
};
