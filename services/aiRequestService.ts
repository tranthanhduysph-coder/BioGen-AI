export class AiRequestError extends Error {
  constructor(message: string, public code: string, public stopBatch = false) {
    super(message);
    this.name = 'AiRequestError';
  }
}

const messageFor = (code: string, lang: string, fallback: string) => {
  const en = lang === 'en';
  switch (code) {
    case 'gemini_daily_quota': return en
      ? 'The Gemini project daily quota is exhausted. Keep the generated questions and retry after the daily reset.'
      : 'Project Gemini đã hết quota AI trong ngày. Các câu đã tạo được giữ lại; thử lại khi quota ngày được cấp lại.';
    case 'gemini_quota_unavailable': return en
      ? 'This Gemini project has no available quota. Check the project quota before retrying.'
      : 'Project Gemini chưa có quota khả dụng. Cần kiểm tra quota của project trước khi thử lại.';
    case 'user_hourly_quota': return en
      ? 'This account has reached its hourly generation limit. Retry later.'
      : 'Tài khoản đã đạt giới hạn tạo câu hỏi trong giờ này. Hãy thử lại sau.';
    case 'gemini_rate_limit': return en
      ? 'Gemini is receiving too many requests. Keep the generated questions and retry later.'
      : 'Gemini đang nhận quá nhiều yêu cầu. Các câu đã tạo được giữ lại; hãy thử lại sau.';
    case 'gemini_configuration': return en
      ? 'Gemini key, model or project access needs to be checked on the backend.'
      : 'Cần kiểm tra Gemini key, model hoặc quyền truy cập project trên backend.';
    case 'gemini_unavailable': return en
      ? 'Gemini is temporarily unavailable. Retry later.'
      : 'Dịch vụ Gemini tạm thời chưa sẵn sàng. Hãy thử lại sau.';
    case 'ai_invalid_question': return en
      ? `AI returned a question with invalid formatting. ${fallback}`
      : `AI trả về câu hỏi chưa đúng định dạng. ${fallback}`;
    case 'unauthorized': return en
      ? 'Your login session is invalid or expired. Sign in again.'
      : 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Hãy đăng nhập lại.';
    default: return fallback;
  }
};

type RequestRuntime = {
  fetch: typeof fetch;
  sleep: (milliseconds: number) => Promise<void>;
};

/** Retry explicit temporary quota/service responses; do not replay lost responses. */
export const requestAiJson = async <T>(
  url: string,
  init: RequestInit,
  lang: string,
  onWait?: (seconds: number) => void,
  runtime: RequestRuntime = {
    fetch: (input, init) => fetch(input, init),
    sleep: milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)),
  },
): Promise<T> => {
  for (let attempt = 0; ; attempt += 1) {
    let response: Response;
    try {
      response = await runtime.fetch(url, init);
    } catch {
      throw new AiRequestError(lang === 'en'
        ? 'Could not connect to the BioGen backend. Keep the generated questions and retry the missing ones when the connection recovers.'
        : 'Không kết nối được backend BioGen. Các câu đã tạo được giữ lại; hãy thử lại các câu còn thiếu khi kết nối ổn định.', 'network_error', true);
    }
    let data: any;
    try {
      data = await response.json();
    } catch {
      throw new AiRequestError(lang === 'en'
        ? 'The BioGen backend returned an unreadable response. Retry later.'
        : 'Backend BioGen trả về phản hồi không đọc được. Hãy thử lại sau.', 'invalid_response', true);
    }
    if (response.ok) return data as T;
    const detail = data?.detail;
    const code = response.status === 401 ? 'unauthorized'
      : typeof detail?.code === 'string' ? detail.code
      : response.status === 429 ? 'user_hourly_quota' : 'backend_error';
    const fallback = typeof detail === 'string' ? detail
      : typeof detail?.message === 'string' ? detail.message : `BioGen HTTP ${response.status}`;
    const seconds = Math.ceil(Number(response.headers.get('Retry-After') ?? detail?.retryAfterSeconds));
    const temporary = (response.status === 429 && code === 'gemini_rate_limit')
      || (response.status === 503 && code === 'gemini_unavailable');
    if (temporary && detail?.retryable === true
      && Number.isFinite(seconds) && seconds > 0 && seconds <= 120 && attempt < 3) {
      onWait?.(seconds);
      try {
        // Small safety margin for the next rolling minute window.
        await runtime.sleep((seconds + 1) * 1000);
      } finally {
        onWait?.(0);
      }
      continue;
    }
    const stopBatch = response.status === 401 || response.status === 429 || response.status >= 500;
    throw new AiRequestError(messageFor(code, lang, fallback), code, stopBatch);
  }
};
