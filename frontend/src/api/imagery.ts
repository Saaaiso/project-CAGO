import { t } from '../i18n';
import { http, USE_MOCK } from './client';

// ===== CONTRACT: поправить, когда придут контракты от бэкенда =====
export interface ImageryRequest {
  fieldName: string;
  lat: number;
  lon: number;
  dateFrom: string;
  dateTo: string;
  source: 'sentinel-2' | 'sentinel-1' | 'weather';
  index: 'ndvi' | 'rgb';
}

export interface ImageryStatus {
  status: string;     // queued | processing | done | failed (уточнить)
  imageUrl?: string;  // ссылка на файл в MinIO
  error?: string;
}

const PATHS = {
  create: '/api/imagery/requests',
  status: (id: string) => `/api/imagery/requests/${id}`,
};
export const DONE = ['done', 'completed', 'ready'];
export const FAILED = ['failed', 'error'];
// ==================================================================

const mockDb: Record<string, number> = {};

export async function createImageryRequest(body: ImageryRequest): Promise<{ id: string }> {
  if (USE_MOCK) {
    const id = 'mock-' + Math.random().toString(36).slice(2, 8);
    mockDb[id] = Date.now();
    return { id };
  }
  return http('POST', PATHS.create, body);
}

export async function getImageryStatus(id: string): Promise<ImageryStatus> {
  if (USE_MOCK) {
    const age = Date.now() - (mockDb[id] ?? 0);
    if (age < 2500) return { status: 'queued' };
    if (age < 6000) return { status: 'processing' };
    return { status: 'done', imageUrl: mockNdviImage(id) };
  }
  return http('GET', PATHS.status(id));
}

// Псевдо-NDVI картинка для моков: зелёный фон с красно-жёлтыми пятнами
function mockNdviImage(seed: string): string {
  let s = [...seed].reduce((a, c) => a + c.charCodeAt(0), 7);
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const blobs = Array.from({ length: 9 }, () => {
    const warm = rnd() > 0.45;
    return `<ellipse cx="${rnd() * 480}" cy="${rnd() * 320}" rx="${30 + rnd() * 80}" ry="${20 + rnd() * 60}" fill="${warm ? '#e0a63a' : '#2e8b4f'}" opacity=".7"/>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320"><defs><filter id="b"><feGaussianBlur stdDeviation="14"/></filter></defs>` +
    `<rect width="480" height="320" fill="#4faa5e"/><g filter="url(#b)">${blobs}</g></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

export interface ImageryResult { id: string; imageUrl: string }

// Создаёт запрос и опрашивает статус до готовности. onStatus — для индикации прогресса/лога.
export async function runImagery(
  req: ImageryRequest, onStatus: (s: string) => void, opts: { pollMs?: number; timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<ImageryResult> {
  const { pollMs = 2000, timeoutMs = 120_000, signal } = opts;
  onStatus('sent');
  const { id } = await createImageryRequest(req);
  const start = Date.now();
  for (;;) {
    if (signal?.aborted) throw new Error('cancelled');
    if (Date.now() - start > timeoutMs) throw new Error(t('Image request timed out'));
    await new Promise(r => setTimeout(r, pollMs));
    const r = await getImageryStatus(id);
    onStatus(r.status);
    if (DONE.includes(r.status)) {
      if (!r.imageUrl) throw new Error(t('The worker finished but returned no image URL'));
      return { id, imageUrl: r.imageUrl };
    }
    if (FAILED.includes(r.status)) throw new Error(r.error ?? t('The worker returned an error'));
  }
}
