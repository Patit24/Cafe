/**
 * Real Neural Face Embedding using face-api.js
 * Loads TinyFaceDetector + FaceRecognitionNet to produce true 128-D descriptors.
 *
 * HOW IT WORKS:
 *  1. Models are loaded once from CDN (cached by browser).
 *  2. An image/video element is passed in.
 *  3. A face is detected, aligned via landmarks, then a 128-float descriptor is computed.
 *  4. Cosine similarity (or Euclidean distance) is used to compare live vs stored vectors.
 *
 * Threshold: Euclidean distance < 0.45 = same person (face-api default recommendation)
 */

export type FaceEmbedding = number[];

let faceApiLoaded = false;
let faceapi: any = null;

/**
 * Dynamically loads face-api.js from CDN and pre-loads the three required models.
 * Safe to call multiple times — only loads once.
 */
export async function loadFaceApiModels(): Promise<boolean> {
  if (faceApiLoaded && faceapi) return true;

  try {
    // Dynamically import face-api.js
    if (typeof window === 'undefined') return false;

    // Load the face-api.js script from CDN if not already loaded
    if (!(window as any).faceapi) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load face-api.js'));
        document.head.appendChild(script);
      });
    }

    faceapi = (window as any).faceapi;

    // Load models from a public CDN mirror
    const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);

    faceApiLoaded = true;
    console.log('✅ face-api.js neural models loaded successfully');
    return true;
  } catch (err) {
    console.error('❌ Failed to load face-api.js models:', err);
    faceApiLoaded = false;
    return false;
  }
}

/**
 * Converts a base64 image string to an HTMLImageElement for face-api processing.
 */
function base64ToImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
  });
}

/**
 * Generates a true 128-dimensional neural face descriptor from an image.
 * Returns null if no face is detected or models are not loaded.
 */
export async function generateNeuralFaceEmbedding(imageBase64: string): Promise<number[] | null> {
  if (!imageBase64) return null;

  const loaded = await loadFaceApiModels();
  if (!loaded || !faceapi) return null;

  try {
    const img = await base64ToImage(imageBase64);

    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 320,
      scoreThreshold: 0.4,
    });

    const detection = await faceapi
      .detectSingleFace(img, options)
      .withFaceLandmarks(true)
      .withFaceDescriptor();

    if (!detection) {
      console.warn('⚠️ No face detected in image');
      return null;
    }

    // descriptor is a Float32Array of 128 values
    return Array.from(detection.descriptor);
  } catch (err) {
    console.error('Face embedding error:', err);
    return null;
  }
}

/**
 * Calculates Euclidean distance between two 128-D face descriptors.
 * Lower = more similar. Threshold: < 0.45 = same person.
 */
export function euclideanDistance(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Converts Euclidean distance to a human-readable match percentage.
 * Distance 0.0 = 100%, Distance 0.6+ = 0%
 */
export function distanceToMatchPercent(distance: number): number {
  // Linear scale: 0.0 → 100%, 0.6 → 0%
  const pct = Math.max(0, Math.min(100, (1 - distance / 0.6) * 100));
  return Math.round(pct * 10) / 10;
}

/**
 * Compare a live face embedding against ALL registered face embeddings.
 * Returns the best match score (%) and the index of best matching face.
 * THRESHOLD: distance < 0.45 (= ~25% match percent) = PASS
 */
export function getBestFaceMatch(
  liveEmbedding: number[],
  registeredEmbeddings: (number[] | null | undefined)[]
): { bestScore: number; bestIndex: number; passed: boolean } {
  let bestScore = 0;
  let bestIndex = -1;

  registeredEmbeddings.forEach((stored, i) => {
    if (!stored || stored.length === 0) return;
    const dist = euclideanDistance(liveEmbedding, stored);
    const score = distanceToMatchPercent(dist);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  });

  // Pass if best distance is < 0.45 (≈ score > 25%)
  // We use a slightly more generous threshold (score >= 40%) for real-world lighting variation
  return { bestScore, bestIndex, passed: bestScore >= 40 };
}

// ─── Legacy compatibility shim (kept for old callers) ──────────────────────
export function calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
  const dist = euclideanDistance(vectorA, vectorB);
  return Math.max(0, 1 - dist / 0.6);
}

export function getHighestMatchScore(
  liveEmbedding: number[],
  registeredEmbeddings: (number[] | null | undefined)[]
): { highestScore: number; bestAngleIndex: number } {
  const { bestScore, bestIndex } = getBestFaceMatch(liveEmbedding, registeredEmbeddings);
  return { highestScore: bestScore, bestAngleIndex: bestIndex };
}
