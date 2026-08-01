/**
 * Real Neural Face Embedding — uses @vladmandic/face-api (installed npm package)
 * Model weights loaded from jsDelivr npm CDN (same package, always 200 OK).
 *
 * Produces a 128-float descriptor via FaceRecognitionNet.
 * Comparison: Euclidean distance  < 0.45 → same person
 */

export type FaceEmbedding = number[];

// Model weights served from the npm package CDN — guaranteed 200
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

let faceapi: any = null;
let modelsLoaded = false;
let loadingPromise: Promise<boolean> | null = null;

/**
 * Load @vladmandic/face-api and its model weights (idempotent).
 */
export async function loadFaceApiModels(): Promise<boolean> {
  if (modelsLoaded && faceapi) return true;
  if (loadingPromise) return loadingPromise; // prevent double-load

  loadingPromise = (async () => {
    try {
      if (typeof window === 'undefined') return false;

      // Dynamic import of the installed npm package
      const mod = await import('@vladmandic/face-api');
      faceapi = mod.default ?? mod;

      console.log('[FaceAPI] Package imported, loading model weights from CDN...');

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      modelsLoaded = true;
      console.log('[FaceAPI] ✅ Neural models ready (TinyFaceDetector + FaceRecognitionNet)');
      return true;
    } catch (err) {
      console.error('[FaceAPI] ❌ Failed to load models:', err);
      modelsLoaded = false;
      loadingPromise = null; // allow retry
      return false;
    }
  })();

  return loadingPromise;
}

/**
 * Creates an HTMLImageElement from a base64 JPEG string.
 */
function makeImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
  });
}

/**
 * Generate a real 128-dimensional neural face descriptor from a base64 image.
 * Returns null if no face is detected or models aren't ready.
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
      scoreThreshold: 0.3, // lower threshold = easier detection
    });

    const result = await faceapi
      .detectSingleFace(img, opts)
      .withFaceLandmarks(true)  // tiny landmarks model
      .withFaceDescriptor();    // 128D FaceRecognitionNet

    if (!result) {
      console.warn('[FaceAPI] No face detected in image');
      return null;
    }

    console.log('[FaceAPI] ✅ Face detected, descriptor length:', result.descriptor.length);
    return Array.from(result.descriptor); // Float32Array → number[]
  } catch (err) {
    console.error('[FaceAPI] Detection error:', err);
    return null;
  }
}

/**
 * Euclidean distance between two 128-D descriptors.
 * Returns Infinity if lengths don't match.
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
 * Convert Euclidean distance to human-readable percentage.
 * 0.0 → 100%,  0.6+ → 0%
 */
export function distanceToMatchPercent(dist: number): number {
  if (!isFinite(dist)) return 0;
  return Math.max(0, Math.min(100, Math.round((1 - dist / 0.6) * 1000) / 10));
}

/**
 * Compare a live 128D embedding against all stored embeddings.
 * Skips stored vectors that are not 128-dimensional (old fake 512D ones).
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

    // Dimension guard: only compare 128D vs 128D
    if (vec.length !== 128) {
      console.warn(`[FaceAPI] Skipping stored embedding at index ${i}: length=${vec.length} (not 128D — please re-register)`);
      return;
    }

    validCount++;
    const dist = euclideanDistance(live, vec);
    const score = distanceToMatchPercent(dist);
    console.log(`[FaceAPI] Embedding[${i}] distance=${dist.toFixed(4)} score=${score}%`);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  });

  // Threshold: 40% ≈ Euclidean ~0.36 (generous for lighting variation)
  return {
    bestScore,
    bestIndex,
    passed: bestScore >= 40,
    noValidStored: validCount === 0,
  };
}

// ── Legacy shims for old call-sites ──────────────────────────────────────────
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
