import { auth } from '../firebaseConfig';
import { requestAiJson } from './aiRequestService';
import type { ExamBlueprint } from '../types/examBlueprint';
import type { ExamSlotPackage } from '../types/examSlots';
import type { GeneratedExamItem, GenerationBatchResult } from '../types/generatedExam';

export type CreditAccount = { enabled: boolean; uid: string; email: string; name: string;
  status: 'pending' | 'approved' | 'blocked'; balance: number; held: number;
  activeExamId: string | null; isAdmin: boolean; trialGranted?: boolean;
  manualBalance?: number; manualHeld?: number; activeManualRunId?: string | null };
export type PurchaseRequest = { id: string; uid: string; email: string; name: string;
  product: 'exam' | 'manual'; package: number; note: string;
  status: 'pending' | 'fulfilled' | 'rejected'; updatedAt: number; reportedPaid?: boolean;
  paymentCode?: string; expectedAmount?: number; paymentIssue?: string; paymentReference?: string; bank?: PaymentConfig['bank'] };
export type PaymentConfig = { automaticPaymentReady: boolean; currency: string;
  exam: { credits: number; priceVnd: number }[]; manual: { turns: number; priceVnd: number };
  bank: { id: string; name: string; accountNumber: string; accountName: string; virtualAccountNumber?: string } };
export type ManualRun = { id: string; status: 'reserved' | 'completed' | 'cancelled';
  batches: {prompt: string; expectedCount: number; lang: string; criteria?: any}[]; results: Record<string, any[]> };
export type CloudExam = { id: string; blueprint: ExamBlueprint; slots: any[];
  items: Record<string, GeneratedExamItem>; status: 'reserved' | 'completed' | 'cancelled';
  units: number; replacedUnits: number; replacementLimit: number;
  usage?: { calls: number; inputTokens: number; outputTokens: number; thinkingTokens: number };
  review: { generatedItems?: GeneratedExamItem[]; approvedSlotIds?: string[]; lockedQuestionIds?: string[] } };
export type ExamSummary = Pick<CloudExam, 'id' | 'status' | 'units' | 'usage'> & { title: string; completed: number };
export type CreditEvent = { id: string; kind: string; balanceDelta: number; heldDelta: number;
  updatedAt: number; note?: string; examId?: string; manualDelta?: number; manualHeldDelta?: number };

export const creditRequest = async <T>(path: string, body?: unknown): Promise<T> => {
  const user = auth?.currentUser;
  if (!user) throw new Error('Hãy đăng nhập Google để sử dụng credit.');
  const base = String((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/$/, '');
  if (!base) throw new Error('Backend BioGen chưa được cấu hình.');
  return requestAiJson<T>(`${base}/api/credits${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }, 'vi');
};

export const getCreditAccount = () => creditRequest<CreditAccount>('/me');
export const getPaymentConfig = () => requestAiJson<PaymentConfig>(`${String((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/$/, '')}/api/payment-plans`, { method: 'GET' }, 'vi');
export const getCloudExam = (id: string) => creditRequest<CloudExam>(`/exams/${encodeURIComponent(id)}`);
export const cloudSlots = (exam: CloudExam): ExamSlotPackage => ({
  mcq: exam.slots.filter(s => s.part === 'mcq'), tf: exam.slots.filter(s => s.part === 'tf'),
  short: exam.slots.filter(s => s.part === 'short'),
});

export const createCreditExam = async (blueprint: ExamBlueprint, slots: ExamSlotPackage) => {
  const user = auth?.currentUser;
  if (!user) throw new Error('Hãy đăng nhập Google.');
  const key = `biogen_credit_create_${user.uid}`;
  const signature = JSON.stringify({ blueprint, slots });
  let pending: { signature: string; requestId: string } | null = null;
  try { pending = JSON.parse(localStorage.getItem(key) || 'null'); } catch { /* old cache */ }
  if (!pending || pending.signature !== signature) {
    pending = { signature, requestId: crypto.randomUUID() };
    localStorage.setItem(key, JSON.stringify(pending));
  }
  // Keep the key on a lost response: another click must reuse this reservation.
  const exam = await creditRequest<CloudExam>('/exams', {
    requestId: pending.requestId, blueprint, slots: [...slots.mcq, ...slots.tf, ...slots.short],
  });
  if (exam.status === 'cancelled') {
    localStorage.removeItem(key);
    throw new Error('Đề cũ đã được hủy. Bấm tạo đề để bắt đầu lượt mới.');
  }
  return exam;
};

export const forgetCreditCreation = () => {
  if (auth?.currentUser) localStorage.removeItem(`biogen_credit_create_${auth.currentUser.uid}`);
};

export const requestCreditItem = async (examId: string, slotId: string, lang: string,
  replace = false, onWait?: (seconds: number) => void): Promise<GeneratedExamItem> => {
  const user = auth?.currentUser;
  if (!user) throw new Error('Hãy đăng nhập Google.');
  const key = `biogen_credit_item_${user.uid}_${examId}_${slotId}_${replace}`;
  let requestId = localStorage.getItem(key);
  if (!requestId) { requestId = crypto.randomUUID(); localStorage.setItem(key, requestId); }
  const base = String((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/$/, '');
  try {
    const item = await requestAiJson<GeneratedExamItem>(`${base}/api/credits/exams/${encodeURIComponent(examId)}/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
      body: JSON.stringify({ slotId, requestId, replace, lang: lang === 'en' ? 'en' : 'vi' }),
    }, lang, onWait);
    localStorage.removeItem(key);
    return item;
  } catch (error) { throw error; } // Retain the same operation ID on any failure.
};

export const requestCreditExamBatch = async (examId: string, slotIds: string[], lang: string,
  onWait?: (seconds: number) => void): Promise<GenerationBatchResult> => {
  const user = auth?.currentUser;
  if (!user) throw new Error('Hãy đăng nhập Google.');
  const key = `biogen_credit_batch_${user.uid}_${examId}`;
  const signature = JSON.stringify([...slotIds].sort());
  let pending: { signature: string; requestId: string } | null = null;
  try { pending = JSON.parse(localStorage.getItem(key) || 'null'); } catch { /* old cache */ }
  if (!pending || pending.signature !== signature) {
    pending = { signature, requestId: crypto.randomUUID() };
    localStorage.setItem(key, JSON.stringify(pending));
  }
  const base = String((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/$/, '');
  const result = await requestAiJson<GenerationBatchResult>(`${base}/api/credits/exams/${encodeURIComponent(examId)}/generate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
    body: JSON.stringify({ slotIds, requestId: pending.requestId, lang: lang === 'en' ? 'en' : 'vi' }),
  }, lang, onWait);
  if (!result || !Array.isArray(result.items) || !Array.isArray(result.failures)) {
    throw new Error('Backend trả về bộ đề không hợp lệ. Giữ nguyên đề và thử lại sau.');
  }
  localStorage.removeItem(key);
  return result;
};
