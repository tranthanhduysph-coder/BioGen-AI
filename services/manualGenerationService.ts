import { auth } from '../firebaseConfig';
import { requestAiJson } from './aiRequestService';
import type { Criteria, GeneratedQuestion } from '../types';
import { generatePrompt } from './geminiService';
import { creditRequest, getCreditAccount, type ManualRun } from './creditService';

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
  const account = await getCreditAccount();
  if (account.enabled) {
    const batches = criteriaList.map(criteria => ({ prompt: generatePrompt(criteria, lang),
      expectedCount: criteria.questionCount, lang: lang === 'en' ? 'en' : 'vi', criteria }));
    const key = `biogen_manual_create_${auth!.currentUser!.uid}`;
    const signature = JSON.stringify(batches);
    let pending: any = null;
    try { pending = JSON.parse(localStorage.getItem(key) || 'null'); } catch { /* old cache */ }
    if (pending?.signature !== signature) pending = { signature, requestId: crypto.randomUUID() };
    localStorage.setItem(key, JSON.stringify(pending));
    const run = await creditRequest<ManualRun>('/manual-runs', { requestId: pending.requestId, batches });
    if (run.status === 'cancelled') {
      localStorage.removeItem(key);
      throw new Error('Lượt cũ đã hủy. Bấm tạo để bắt đầu lượt mới.');
    }
    const questions = await generateRegisteredRun(run, idToken);
    localStorage.removeItem(key);
    return questions;
  }
  const results: GeneratedQuestion[] = [];
  for (const criteria of criteriaList) {
    results.push(...await generateCriteriaBatch(criteria, lang, idToken));
  }
  return results;
};

const generateRegisteredRun = async (run: ManualRun, idToken: string): Promise<GeneratedQuestion[]> => {
  const results: GeneratedQuestion[] = [];
  for (let index = 0; index < run.batches.length; index++) {
    const batch = run.batches[index];
    const data = run.results[String(index)] ?? await requestAiJson<GeneratedQuestion[]>(`${apiBase()}/api/questions/generate-manual`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ prompt: batch.prompt, expectedCount: batch.expectedCount, lang: batch.lang,
        runId: run.id, batchIndex: index }),
    }, batch.lang);
    results.push(...data.map(question => ({ ...question, criteria: batch.criteria })));
  }
  return results;
};

export const resumeManualQuestions = async (): Promise<GeneratedQuestion[]> => {
  const idToken = await requireIdToken('vi');
  const account = await getCreditAccount();
  if (!account.activeManualRunId) throw new Error('Không có lượt câu hỏi lẻ đang dở.');
  const run = await creditRequest<ManualRun>(`/manual-runs/${account.activeManualRunId}`);
  const results = await generateRegisteredRun(run, idToken);
  localStorage.removeItem(`biogen_manual_create_${auth!.currentUser!.uid}`);
  return results;
};
