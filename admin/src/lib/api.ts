const envUrl = process.env.NEXT_PUBLIC_API_URL || '';

// Sanitization: If Vercel env is missing or has placeholder 'your-render-service', force live Render URL
export const API_BASE_URL =
  envUrl && !envUrl.includes('your-render-service')
    ? envUrl
    : 'https://cafe-ho1d.onrender.com';
