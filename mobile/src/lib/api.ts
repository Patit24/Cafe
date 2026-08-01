const envUrl = process.env.EXPO_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || '';

export const API_BASE_URL =
  envUrl && !envUrl.includes('your-render-service') && !envUrl.includes('cafe-ho1d') && !envUrl.includes('localhost')
    ? envUrl
    : 'https://backend-gold-sigma-74.vercel.app';
