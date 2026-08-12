import { NativeModules, Platform } from 'react-native';

const { KbyFaceSDK } = NativeModules;

export type FaceEmbedding = number[] | string;

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
 * Check if high-speed KBY-AI Native C++/TFLite FaceSDK is available (Android Native).
 */
export function isNativeKbyFaceSDKAvailable(): boolean {
  return Platform.OS === 'android' && Boolean(KbyFaceSDK);
}

/**
 * Load @vladmandic/face-api and model weights for Web / Fallback environments.
 */
export async function loadFaceApiModels(): Promise<boolean> {
  if (isNativeKbyFaceSDKAvailable()) {
    console.log('[FaceSDK] Using Native KBY-AI Android C++/TFLite FaceEngine');
    return true;
  }

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
 * Generate facial embedding template from base64 image.
 * Uses native KBY-AI FaceSDK on Android, falls back to face-api on Web.
 */
export async function generateNeuralFaceEmbedding(imageBase64: string): Promise<any | null> {
  if (!imageBase64) return null;

  // 1. Try Native Android KBY-AI FaceSDK
  if (isNativeKbyFaceSDKAvailable()) {
    try {
      const res = await KbyFaceSDK.detectFaceAndExtractTemplate(imageBase64, true);
      if (res && res.faceDetected && res.template) {
        console.log('[KbyFaceSDK] ✅ Native face template extracted! Liveness:', res.liveness);
        return res.template; // Base64 template string
      }
      console.warn('[KbyFaceSDK] Native detection returned no face:', res?.reason);
      return null;
    } catch (e) {
      console.error('[KbyFaceSDK] Native detection error:', e);
    }
  }

  // 2. Web / Fallback
  const ready = await loadFaceApiModels();
  if (!ready || !faceapi) return null;

  try {
    const img = await makeImage(imageBase64);

    let result = await faceapi
      .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!result) {
      result = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.2 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
    }

    if (!result) {
      console.warn('[FaceAPI] No face detected');
      return null;
    }

    const rawDescriptor = Array.from(result.descriptor) as number[];
    return normalizeL2(rawDescriptor);
  } catch (err) {
    console.error('[FaceAPI] Error generating embedding:', err);
    return null;
  }
}

/**
 * Perform high-accuracy face matching.
 * Uses native KBY-AI FaceSDK similarity on Android when native templates are present.
 */
export function getBestFaceMatch(
  live: any,
  stored: (any | null | undefined)[]
): { bestScore: number; bestIndex: number; passed: boolean; noValidStored: boolean } {
  if (!live) {
    return { bestScore: 0, bestIndex: -1, passed: false, noValidStored: true };
  }

  let bestScore = 0;
  let bestIndex = -1;
  let validCount = 0;

  stored.forEach((vec, i) => {
    if (!vec) return;

    if (Array.isArray(vec) && Array.isArray(live) && vec.length === live.length) {
      validCount++;
      const dist = euclideanDistance(live, vec);
      const score = distanceToMatchPercent(dist);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
  });

  return {
    bestScore,
    bestIndex,
    passed: bestScore >= 80,
    noValidStored: validCount === 0,
  };
}

/**
 * Native async helper to match live template directly via KBY-AI engine
 */
export async function matchLiveFaceNative(liveTemplate: string, storedTemplates: string[], threshold = 0.75) {
  if (!isNativeKbyFaceSDKAvailable()) return null;
  try {
    return await KbyFaceSDK.getBestMatch(liveTemplate, storedTemplates, threshold);
  } catch (e) {
    console.error('[KbyFaceSDK] Match error:', e);
    return null;
  }
}

export function l2Norm(vector: number[]): number {
  let sum = 0;
  for (let i = 0; i < vector.length; i++) {
    sum += vector[i] * vector[i];
  }
  return Math.sqrt(sum);
}

export function normalizeL2(vector: number[]): number[] {
  const norm = l2Norm(vector);
  if (norm < 1e-12) return vector;
  return vector.map((v) => v / norm);
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
  }
  return Math.max(0, Math.min(1.0, dot));
}

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
  if (!isFinite(dist) || dist > 0.52) return 0;
  if (dist <= 0.40) {
    // High confidence match: 80% to 99%
    return Math.round(99 - (dist / 0.40) * 19);
  } else {
    // Rapidly drop off for distances > 0.40 (different people)
    return Math.max(0, Math.round(75 - ((dist - 0.40) / 0.12) * 75));
  }
}
