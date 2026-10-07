export interface ExamBackendHealth {
  ok: boolean;
  service: string;
  environment: string;
  aiConfigured: boolean;
  authRequired: boolean;
  firebaseProjectId: string;
  generationUnitsPerHour: number;
  model: string;
  authRequired: boolean;
  firebaseProjectId: string;
}

const apiBase = () => {
  const value = (import.meta as any).env?.VITE_API_BASE_URL || '';
  return String(value).replace(/\/$/, '');
};

export const getExamBackendHealth = async (): Promise<ExamBackendHealth | null> => {
  const base = apiBase();
  if (!base) return null;

  try {
    const response = await fetch(`${base}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) return null;
    const data = await response.json();

    if (!data || data.ok !== true) return null;

    return {
      ok: true,
      service: String(data.service || 'biogenai-api'),
      environment: String(data.environment || ''),
      aiConfigured: Boolean(data.aiConfigured),
      authRequired: Boolean(data.authRequired),
      firebaseProjectId: String(data.firebaseProjectId || ''),
      generationUnitsPerHour: Number(data.generationUnitsPerHour || 0),
      model: String(data.model || ''),
      authRequired: Boolean(data.authRequired),
      firebaseProjectId: String(data.firebaseProjectId || ''),
    };
  } catch {
    return null;
  }
};
