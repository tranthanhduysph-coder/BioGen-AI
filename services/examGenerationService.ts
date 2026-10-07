import { auth } from '../firebaseConfig';
import type { GeneratedExamItem, GenerationProgress } from '../types/generatedExam';
import { auth } from '../firebaseConfig';
import type {
  ExamQuestionSlot,
  ExamSlotPackage,
  TrueFalseQuestionSlot,
} from '../types/examSlots';

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

const getFirebaseIdToken = async (lang: string) => {
  const currentUser = auth?.currentUser;
  if (!currentUser) {
    throw new Error(
      lang === 'en'
        ? 'Sign in with a real Firebase account before using AI generation. Demo mode can still test the workflow without AI.'
        : 'Hãy đăng nhập bằng tài khoản Firebase thật trước khi tạo đề bằng AI. Chế độ demo vẫn có thể kiểm thử toàn bộ workflow không dùng AI.',
    );
  }

  return currentUser.getIdToken();
};

export const generateExamItem = async (
  slot: ExamQuestionSlot | TrueFalseQuestionSlot,
  lang: string = 'vi',
): Promise<GeneratedExamItem> => {
  const base = apiBase();
  if (!base) {
    throw new Error(
      lang === 'en'
        ? 'BioGen backend API is not configured.'
        : 'Backend BioGen chưa được cấu hình.',
    );
  }

  const idToken = await getFirebaseIdToken(lang);

  const response = await fetch(`${base}/api/exam/generate-item`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ slot, lang }),
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
          ? 'The BioGen backend is ready, but GEMINI_API_KEY has not been configured yet.'
          : 'Backend BioGen đã hoạt động nhưng chưa được cấu hình GEMINI_API_KEY.',
      );
    }

    throw new Error(detail);
  }

  const data = await response.json();
  if (
    !data ||
    typeof data !== 'object' ||
    typeof data.slotId !== 'string' ||
    !data.question
  ) {
    throw new Error(
      lang === 'en'
        ? 'BioGen backend returned an invalid response.'
        : 'Backend BioGen trả về dữ liệu không hợp lệ.',
    );
  }

  return data as GeneratedExamItem;
};

const runWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
  onProgress?: (progress: GenerationProgress) => void,
): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  let completed = 0;

  const runners = Array.from(
    { length: Math.min(limit, Math.max(1, items.length)) },
    async () => {
      while (cursor < items.length) {
        const index = cursor;
        cursor += 1;
        results[index] = await worker(items[index]);
        completed += 1;
        onProgress?.({ completed, total: items.length });
      }
    },
  );

  await Promise.all(runners);
  return results;
};

export const generateExamFromSlots = async (
  slots: ExamSlotPackage,
  lang: string = 'vi',
  onProgress?: (progress: GenerationProgress) => void,
): Promise<GeneratedExamItem[]> => {
  const orderedSlots: Array<ExamQuestionSlot | TrueFalseQuestionSlot> = [
    ...slots.mcq,
    ...slots.tf,
    ...slots.short,
  ];

  return runWithConcurrency(
    orderedSlots,
    3,
    (slot) => generateExamItem(slot, lang),
    onProgress,
  );
};
