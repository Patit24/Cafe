const envUrl = process.env.NEXT_PUBLIC_API_URL || '';

export const API_BASE_URL =
  envUrl && !envUrl.includes('your-render-service') && !envUrl.includes('cafe-ho1d')
    ? envUrl
    : 'https://backend-gold-sigma-74.vercel.app';

// In-memory cache to prevent duplicate fetches
const _cache: Record<string, { data: any; ts: number }> = {};
const CACHE_TTL = 20000; // 20 seconds

export function getCached(key: string) {
  const entry = _cache[key];
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}

export function setCached(key: string, data: any) {
  _cache[key] = { data, ts: Date.now() };
}

export function invalidateCache(key?: string) {
  if (key) {
    delete _cache[key];
  } else {
    Object.keys(_cache).forEach(k => delete _cache[k]);
  }
}

// Fast fetch with timeout to prevent page freeze
export async function fastFetch(url: string, options: RequestInit = {}, timeoutMs = 8000) {
  // Return cached GET responses immediately
  const isGet = !options.method || options.method === 'GET';
  if (isGet) {
    const cached = getCached(url);
    if (cached) return { json: async () => cached, ok: true, status: 200 } as any;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // Cache successful GET responses
    if (isGet && res.ok) {
      const cloned = res.clone();
      cloned.json().then(data => setCached(url, data)).catch(() => {});
    }

    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

