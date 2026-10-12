import { auth } from '../firebaseConfig';
import { AiRequestError, requestAiJson } from './aiRequestService';
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
  onWait?: (seconds: number) => void,
): Promise<GeneratedExamItem> => {
  const base = apiBase();
  if (!base) {
    throw new Error(
      lang === 'en'
        ? 'BioGen backend API is not configured.'
        : 'Backend BioGen chưa được cấu hình.',
    );
  }

  const data = await requestAiJson<GeneratedExamItem>(`${base}/api/exam/generate-item`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ slot, lang }),
  }, lang, onWait);

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
  let completed = 0;
  let stoppedError: Error | null = null;

  // A quota applies to the project, so a fatal quota/network error stops new requests.
  // Successful items are delivered immediately and remain available for draft recovery.
  for (const slot of slots) {
    try {
      if (stoppedError) throw stoppedError;
      const item = await requestExamItem(slot, lang, idToken, (waitingSeconds) => {
        onProgress?.({ completed, total: slots.length, waitingSeconds });
      });
      items.push(item);
      onItem?.(item);
    } catch (error) {
      if (error instanceof AiRequestError && error.stopBatch) stoppedError = error;
      failures.push({
        slotId: slot.id,
        part: slot.part,
        order: slot.order,
        message: error instanceof Error ? error.message
          : (lang === 'en' ? 'Question generation failed.' : 'Không thể tạo câu hỏi.'),
      });
    } finally {
      completed += 1;
      onProgress?.({ completed, total: slots.length });
    }
  }

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
