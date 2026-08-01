const envUrl = process.env.NEXT_PUBLIC_API_URL || '';

export const API_BASE_URL =
  envUrl && !envUrl.includes('your-render-service') && !envUrl.includes('cafe-ho1d')
    ? envUrl
    : 'https://backend-gold-sigma-74.vercel.app';

// Fast fetch with timeout to prevent page freeze
export async function fastFetch(url: string, options: RequestInit = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}
