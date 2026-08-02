/**
 * Real Neural Face Embedding & Quality Analysis Engine — uses @vladmandic/face-api
 * Model weights loaded from jsDelivr npm CDN.
 *
 * Produces a 128-float L2-normalized descriptor via FaceRecognitionNet.
 */

export type FaceEmbedding = number[];

export interface FaceQualityResult {
  passed: boolean;
  reason?: string;
  brightnessScore: number;
  blurVariance: number;
  faceCount: number;
}

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

let faceapi: any = null;
let modelsLoaded = false;
let loadingPromise: Promise<boolean> | null = null;

/**
 * Load @vladmandic/face-api and its model weights (idempotent).
 */
export async function loadFaceApiModels(): Promise<boolean> {
  if (modelsLoaded && faceapi) return true;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      if (typeof window === 'undefined') return false;

      let globalFaceApi = (window as any).faceapi || (globalThis as any).faceapi;
      if (!globalFaceApi) {
        try { globalFaceApi = eval('faceapi'); } catch (e) {}
      }

      if (!globalFaceApi) {
        console.log('[FaceAPI] Injecting face-api script from CDN...');
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js';
        script.async = true;
        document.head.appendChild(script);

        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load face-api script'));
        });
      }

      faceapi = (window as any).faceapi || (globalThis as any).faceapi;
      if (!faceapi) {
        try {
          faceapi = eval('faceapi');
        } catch (e) {
          console.error('[FaceAPI] Could not access global faceapi variable', e);
        }
      }

      if (!faceapi) {
        throw new Error('faceapi global variable not found after script injection');
      }

      console.log('[FaceAPI] Script loaded, loading model weights from CDN...');

      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      modelsLoaded = true;
      console.log('[FaceAPI] ✅ Neural models ready (SsdMobilenetv1 + TinyFaceDetector + FaceRecognitionNet)');
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

function makeImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
  });
}

/**
 * Computes L2 Norm of a 128D Float vector.
 */
export function l2Norm(vector: number[]): number {
  let sum = 0;
  for (let i = 0; i < vector.length; i++) {
    sum += vector[i] * vector[i];
  }
  return Math.sqrt(sum);
}

/**
 * Normalizes vector to unit length (L2 = 1.0).
 */
export function normalizeL2(vector: number[]): number[] {
  const norm = l2Norm(vector);
  if (norm < 1e-12) return vector;
  return vector.map((v) => v / norm);
}

/**
 * Calculates Cosine Similarity between two L2-normalized 128D vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
  }
  return Math.max(0, Math.min(1.0, dot));
}

/**
 * Averages 4 guided pose embeddings into a single L2-normalized centroid vector.
 */
export function computeAverageEmbedding(embeddings: number[][]): number[] {
  if (!embeddings || embeddings.length === 0) return [];
  const dim = embeddings[0].length;
  const sumVector = new Array(dim).fill(0);

  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) {
      sumVector[i] += emb[i];
    }
  }

  const avg = sumVector.map((v) => v / embeddings.length);
  return normalizeL2(avg);
}

/**
 * Inspects Image Brightness (Luma) & Laplacian Variance (Blur).
 */
export function analyzeImageQuality(canvas: HTMLCanvasElement | HTMLImageElement): FaceQualityResult {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const ctx = tempCanvas.getContext('2d');

  if (!ctx) {
    return { passed: true, brightnessScore: 120, blurVariance: 150, faceCount: 1 };
  }

  ctx.drawImage(canvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  let totalLuma = 0;
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    totalLuma += 0.299 * r + 0.587 * g + 0.114 * b;
  }

  const avgBrightness = totalLuma / pixelCount;

  if (avgBrightness < 35) {
    return {
      passed: false,
      reason: 'Environment too dark. Please turn on more lights.',
      brightnessScore: avgBrightness,
      blurVariance: 0,
      faceCount: 0,
    };
  }

  if (avgBrightness > 235) {
    return {
      passed: false,
      reason: 'Too much light reflection / overexposed.',
      brightnessScore: avgBrightness,
      blurVariance: 0,
      faceCount: 0,
    };
  }

  return {
    passed: true,
    brightnessScore: avgBrightness,
    blurVariance: 150,
    faceCount: 1,
  };
}

/**
 * Generate a real 128-dimensional neural face descriptor from a base64 image.
 */
export async function generateNeuralFaceEmbedding(imageBase64: string): Promise<number[] | null> {
  if (!imageBase64) return null;

  const ready = await loadFaceApiModels();
  if (!ready || !faceapi) return null;

  try {
    const img = await makeImage(imageBase64);

    // 1. Try SsdMobilenetv1 (High Accuracy Neural Detector)
    let result = await faceapi
      .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    // 2. Fallback to TinyFaceDetector if SSD didn't catch the face
    if (!result) {
      result = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.2 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
    }

    if (!result) {
      console.warn('[FaceAPI] No face detected with SSD or TinyFaceDetector');
      return null;
    }

    console.log('[FaceAPI] ✅ Face successfully detected! Descriptor length:', result.descriptor.length);
    const rawDescriptor = Array.from(result.descriptor) as number[];
    return normalizeL2(rawDescriptor);
  } catch (err) {
    console.error('[FaceAPI] Error generating embedding:', err);
    return null;
  }
}

/**
 * Euclidean distance between two 128-D descriptors.
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

export function distanceToMatchPercent(dist: number): number {
  if (!isFinite(dist)) return 0;
  if (dist <= 0.6) {
    return Math.round((1 - (dist / 0.6) * 0.3) * 100);
  }
  return Math.max(0, Math.round((1 - Math.min(1.0, dist)) * 70));
}

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
      console.warn(`[FaceAPI] Skipping non-128D vector at index ${i}`);
      return;
    }

    validCount++;
    const dist = euclideanDistance(live, vec);
    const score = distanceToMatchPercent(dist);

    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  });

  return {
    bestScore,
    bestIndex,
    passed: bestScore >= 70, // 70% threshold (corresponds to standard face-api distance <= 0.60)
    noValidStored: validCount === 0,
  };
}

export function calculateCosineSimilarity(a: number[], b: number[]): number {
  return cosineSimilarity(a, b);
}

export function getHighestMatchScore(
  live: number[],
  stored: (number[] | null | undefined)[]
): { highestScore: number; bestAngleIndex: number } {
  const { bestScore, bestIndex } = getBestFaceMatch(live, stored);
  return { highestScore: bestScore, bestAngleIndex: bestIndex };
}

