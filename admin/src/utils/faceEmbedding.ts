/**
 * Real Neural Face Embedding — uses @vladmandic/face-api
 * For Next.js (admin): uses dynamic import with 'use client' compatibility
 * For Expo web (mobile): same
 *
 * Model weights loaded from jsDelivr npm CDN.
 * Produces a true 128-float FaceRecognitionNet descriptor.
 * Euclidean distance < 0.45 → same person.
 */

export type FaceEmbedding = number[];

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

let faceapi: any = null;
let modelsLoaded = false;
let loadingPromise: Promise<boolean> | null = null;

/**
 * Load face-api.js and its neural network weights. Idempotent.
 */
export async function loadFaceApiModels(): Promise<boolean> {
  if (modelsLoaded && faceapi) return true;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      if (typeof window === 'undefined') return false; // SSR guard

      // Dynamic import — works in both Next.js (client) and Expo web
      const mod = await import('@vladmandic/face-api');
      faceapi = (mod as any).default ?? mod;

      console.log('[FaceAPI] Package imported, loading model weights...');

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      modelsLoaded = true;
      console.log('[FaceAPI] ✅ Neural models ready (128D FaceRecognitionNet)');
      return true;
    } catch (err) {
      console.error('[FaceAPI] ❌ Failed to load models:', err);
      modelsLoaded = false;
      loadingPromise = null;
      return false;
    }
  })();

  return loadingPromise;
}

/**
 * Convert base64 image to HTMLImageElement.
 */
function makeImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
  });
}

/**
 * Generate a real 128D neural face descriptor from a base64 image.
 * Returns null if no face detected or models aren't ready.
 */
export async function generateNeuralFaceEmbedding(imageBase64: string): Promise<number[] | null> {
  if (!imageBase64) return null;

  const ready = await loadFaceApiModels();
  if (!ready || !faceapi) {
    console.warn('[FaceAPI] Models not ready');
    return null;
  }

  try {
    const img = await makeImage(imageBase64);

    const opts = new faceapi.TinyFaceDetectorOptions({
      inputSize: 320,
      scoreThreshold: 0.3,
    });

    const result = await faceapi
      .detectSingleFace(img, opts)
      .withFaceLandmarks(true)
      .withFaceDescriptor();

    if (!result) {
      console.warn('[FaceAPI] No face detected in image');
      return null;
    }

    console.log('[FaceAPI] ✅ Face detected — descriptor length:', result.descriptor.length);
    return Array.from(result.descriptor);
  } catch (err) {
    console.error('[FaceAPI] Detection error:', err);
    return null;
  }
}

/**
 * Euclidean distance between two 128D vectors.
 */
export function euclideanDistance(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/**
 * Euclidean distance → match percentage (0.0 → 100%, 0.6+ → 0%).
 */
export function distanceToMatchPercent(dist: number): number {
  if (!isFinite(dist)) return 0;
  return Math.max(0, Math.min(100, Math.round((1 - dist / 0.6) * 1000) / 10));
}

/**
 * Compare live 128D embedding against all stored embeddings.
 * Skips any stored vector that is NOT 128-dimensional (old fake ones).
 */
export function getBestFaceMatch(
  live: number[],
  stored: (number[] | null | undefined)[]
): { bestScore: number; bestIndex: number; passed: boolean; noValidStored: boolean } {
  let bestScore = 0;
  let bestIndex = -1;
  let validCount = 0;

  stored.forEach((vec, i) => {
    if (!vec || vec.length === 0) return;

    if (vec.length !== 128) {
      console.warn(`[FaceAPI] Skipping embedding[${i}]: length=${vec.length} (need 128D — re-register this face)`);
      return;
    }

    validCount++;
    const dist = euclideanDistance(live, vec);
    const score = distanceToMatchPercent(dist);
    console.log(`[FaceAPI] Embedding[${i}] distance=${dist.toFixed(4)} → ${score}%`);

    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  });

  return {
    bestScore,
    bestIndex,
    passed: bestScore >= 40,
    noValidStored: validCount === 0,
  };
}

// ── Legacy shims ─────────────────────────────────────────────────────────────
export function calculateCosineSimilarity(a: number[], b: number[]): number {
  const d = euclideanDistance(a, b);
  return isFinite(d) ? Math.max(0, 1 - d / 0.6) : 0;
}

export function getHighestMatchScore(
  live: number[],
  stored: (number[] | null | undefined)[]
): { highestScore: number; bestAngleIndex: number } {
  const { bestScore, bestIndex } = getBestFaceMatch(live, stored);
  return { highestScore: bestScore, bestAngleIndex: bestIndex };
}
