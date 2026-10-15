import { auth } from '../firebaseConfig';
import { requestAiJson } from './aiRequestService';
import { requestCreditItem, requestCreditExamBatch } from './creditService';
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
  creditExamId?: string,
): Promise<GeneratedExamItem> => {
  if (creditExamId) return requestCreditItem(creditExamId, slot.id, lang, true);
  const idToken = await getFirebaseIdToken(lang);
  return requestExamItem(slot, lang, idToken);
};

export const generateExamItems = async (
  slots: AnyExamSlot[],
  lang: string = 'vi',
  onProgress?: (progress: GenerationProgress) => void,
  onItem?: (item: GeneratedExamItem) => void,
  creditExamId?: string,
): Promise<GenerationBatchResult> => {
  if (slots.length === 0) {
    onProgress?.({ completed: 0, total: 0 });
    return { items: [], failures: [] };
  }

  const idToken = await getFirebaseIdToken(lang);
  const items: GeneratedExamItem[] = [];
  const failures: GenerationFailure[] = [];
  onProgress?.({ completed: 0, total: slots.length });
  try {
    const wait = (waitingSeconds: number) => onProgress?.({ completed: 0, total: slots.length, waitingSeconds });
    const result = creditExamId
      ? await requestCreditExamBatch(creditExamId, slots.map(slot => slot.id), lang, wait)
      : await requestAiJson<GenerationBatchResult>(`${apiBase()}/api/exam/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ slots, lang: lang === 'en' ? 'en' : 'vi' }),
      }, lang, wait);
    if (!result || !Array.isArray(result.items) || !Array.isArray(result.failures)) throw new Error('Invalid exam response.');
    for (const slot of slots) {
      const matches = result.items.filter(item => item.slotId === slot.id);
      if (matches.length === 1 && matches[0].part === slot.part && matches[0].order === slot.order && matches[0].question) {
        items.push(matches[0]);
      } else {
        const failure = result.failures.find(item => item.slotId === slot.id);
        failures.push({ slotId: slot.id, part: slot.part, order: slot.order,
          message: failure?.message || (lang === 'en' ? 'Question missing or invalid in the exam response.' : 'Bộ đề trả về thiếu câu hoặc sai định dạng ở vị trí này.') });
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : (lang === 'en' ? 'Exam generation failed.' : 'Không thể tạo đề.');
    for (const slot of slots) failures.push({ slotId: slot.id, part: slot.part, order: slot.order, message });
  }
  for (const item of items) onItem?.(item);
  onProgress?.({ completed: slots.length, total: slots.length });

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
  creditExamId?: string,
): Promise<GenerationBatchResult> => {
  const orderedSlots: AnyExamSlot[] = [
    ...slots.mcq,
    ...slots.tf,
    ...slots.short,
  ];

  return generateExamItems(orderedSlots, lang, onProgress, onItem, creditExamId);
};
