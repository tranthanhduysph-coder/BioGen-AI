import { auth } from '../firebaseConfig';
import type {
  GeneratedExamItem,
  GenerationBatchResult,
  GenerationFailure,
  GenerationProgress,
} from '../types/generatedExam';
import type {
  ExamQuestionSlot,
  ExamSlotPackage,
  TrueFalseQuestionSlot,
} from '../types/examSlots';

type AnyExamSlot = ExamQuestionSlot | TrueFalseQuestionSlot;

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

const requestExamItem = async (
  slot: AnyExamSlot,
  lang: string,
  idToken: string,
): Promise<GeneratedExamItem> => {
  const base = apiBase();
  if (!base) {
    throw new Error(
      lang === 'en'
        ? 'BioGen backend API is not configured.'
        : 'Backend BioGen chưa được cấu hình.',
    );
  }

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

    if (response.status === 429) {
      throw new Error(
        lang === 'en'
          ? 'AI generation quota for this account has been reached. Please try again later.'
          : 'Tài khoản đã đạt giới hạn tạo câu hỏi AI trong giờ này. Hãy thử lại sau.',
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

export const generateExamItem = async (
  slot: AnyExamSlot,
  lang: string = 'vi',
): Promise<GeneratedExamItem> => {
  const idToken = await getFirebaseIdToken(lang);
  return requestExamItem(slot, lang, idToken);
};

export const generateExamItems = async (
  slots: AnyExamSlot[],
  lang: string = 'vi',
  onProgress?: (progress: GenerationProgress) => void,
  onItem?: (item: GeneratedExamItem) => void,
): Promise<GenerationBatchResult> => {
  if (slots.length === 0) {
    onProgress?.({ completed: 0, total: 0 });
    return { items: [], failures: [] };
  }

  const idToken = await getFirebaseIdToken(lang);
  const items: GeneratedExamItem[] = [];
  const failures: GenerationFailure[] = [];
  let cursor = 0;
  let completed = 0;

  const runners = Array.from(
    { length: Math.min(3, slots.length) },
    async () => {
      while (cursor < slots.length) {
        const index = cursor;
        cursor += 1;
        const slot = slots[index];

        try {
          const item = await requestExamItem(slot, lang, idToken);
          items.push(item);
          onItem?.(item);
        } catch (error) {
          failures.push({
            slotId: slot.id,
            part: slot.part,
            order: slot.order,
            message:
              error instanceof Error
                ? error.message
                : (lang === 'en' ? 'Question generation failed.' : 'Không thể tạo câu hỏi.'),
          });
        } finally {
          completed += 1;
          onProgress?.({ completed, total: slots.length });
        }
      }
    },
  );

  await Promise.all(runners);

  const partOrder = { mcq: 0, tf: 1, short: 2 } as const;
  items.sort((a, b) => {
    const partDiff = partOrder[a.part] - partOrder[b.part];
    return partDiff !== 0 ? partDiff : a.order - b.order;
  });
  failures.sort((a, b) => {
    const partDiff = partOrder[a.part] - partOrder[b.part];
    return partDiff !== 0 ? partDiff : a.order - b.order;
  });

  return { items, failures };
};

export const generateExamFromSlots = async (
  slots: ExamSlotPackage,
  lang: string = 'vi',
  onProgress?: (progress: GenerationProgress) => void,
  onItem?: (item: GeneratedExamItem) => void,
): Promise<GenerationBatchResult> => {
  const orderedSlots: AnyExamSlot[] = [
    ...slots.mcq,
    ...slots.tf,
    ...slots.short,
  ];

  return generateExamItems(orderedSlots, lang, onProgress, onItem);
};
