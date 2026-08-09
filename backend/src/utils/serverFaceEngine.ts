import { TextEncoder as NodeTextEncoder, TextDecoder as NodeTextDecoder } from 'util';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';
import { Logger } from '@nestjs/common';

const logger = new Logger('ServerFaceEngine');
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

let modelsLoaded = false;
let loadingPromise: Promise<boolean> | null = null;
let tf: any = null;
let faceapi: any = null;

function loadEngineModulesSafe(): boolean {
  if (tf && faceapi) return true;
  try {
    const nodeUtil = require('util');
    if (nodeUtil) {
      if (!nodeUtil.TextEncoder) nodeUtil.TextEncoder = NodeTextEncoder || globalThis.TextEncoder;
      if (!nodeUtil.TextDecoder) nodeUtil.TextDecoder = NodeTextDecoder || globalThis.TextDecoder;
    }
    if (!tf) tf = require('@tensorflow/tfjs');
    if (!faceapi) {
      try {
        faceapi = require('@vladmandic/face-api');
      } catch {
        faceapi = require('@vladmandic/face-api/dist/face-api.js');
      }
    }
    return !!(tf && faceapi);
  } catch (e) {
    logger.warn('FaceAPI optional engine load warning:', e);
    return false;
  }
}

export async function initServerFaceEngine(): Promise<boolean> {
  if (modelsLoaded) return true;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const ok = loadEngineModulesSafe();
      if (!ok || !tf || !faceapi) {
        logger.warn('TensorFlow/FaceAPI native module unavailable, skipping server-side model preload.');
        return false;
      }
      logger.log('Initializing TF.js engine backend...');
      try {
        await tf.setBackend('wasm');
        await tf.ready();
      } catch (wasmErr) {
        logger.warn('WASM backend init failed, falling back to default CPU/JS engine:', wasmErr);
        await tf.setBackend('cpu');
        await tf.ready();
      }
      logger.log(`TF backend ready (${tf.getBackend()}). Downloading FaceAPI models from CDN...`);

      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      modelsLoaded = true;
      logger.log('✅ Server-Side FaceAPI Neural Models Loaded Successfully!');
      return true;
    } catch (error) {
      logger.error('❌ Failed to load FaceAPI models:', error);
      modelsLoaded = false;
      loadingPromise = null;
      return false;
    }
  })();

  return loadingPromise;
}

function l2Norm(vector: number[]): number {
  let sum = 0;
  for (let i = 0; i < vector.length; i++) {
    sum += vector[i] * vector[i];
  }
  return Math.sqrt(sum);
}

function normalizeL2(vector: number[]): number[] {
  const norm = l2Norm(vector);
  if (norm < 1e-12) return vector;
  return vector.map((v) => v / norm);
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

export function distanceToScore(dist: number): number {
  if (!isFinite(dist)) return 0;
  if (dist <= 0.50) {
    return Math.round(99 - (dist / 0.50) * 24);
  } else {
    return Math.max(0, Math.round(70 - ((dist - 0.50) / 0.50) * 50));
  }
}

/**
 * Extracts a 128D normalized neural face vector from a Base64 encoded image (JPEG or PNG).
 */
export async function extractFaceVectorFromBase64(base64Image: string): Promise<number[] | null> {
  const ready = await initServerFaceEngine();
  if (!ready || !tf || !faceapi) {
    logger.error('Cannot extract face vector because engine models are unavailable.');
    return null;
  }

  let tensor: any = null;
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    let width: number;
    let height: number;
    let rgbData: Uint8Array;

    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      const png = PNG.sync.read(buffer);
      width = png.width;
      height = png.height;
      rgbData = new Uint8Array(width * height * 3);
      let idx = 0;
      for (let i = 0; i < png.data.length; i += 4) {
        rgbData[idx++] = png.data[i];
        rgbData[idx++] = png.data[i + 1];
        rgbData[idx++] = png.data[i + 2];
      }
    } else {
      const raw = jpeg.decode(buffer, { useTArray: true });
      width = raw.width;
      height = raw.height;
      rgbData = new Uint8Array(width * height * 3);
      let idx = 0;
      for (let i = 0; i < raw.data.length; i += 4) {
        rgbData[idx++] = raw.data[i];
        rgbData[idx++] = raw.data[i + 1];
        rgbData[idx++] = raw.data[i + 2];
      }
    }

    tensor = tf.tensor3d(rgbData, [height, width, 3], 'int32');

    let result = await faceapi
      .detectSingleFace(tensor, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.15 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!result) {
      result = await faceapi
        .detectSingleFace(tensor, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
    }

    if (!result || !result.descriptor) {
      logger.warn('No valid face detected in the submitted image.');
      return null;
    }

    const rawVector = Array.from(result.descriptor) as number[];
    return normalizeL2(rawVector);
  } catch (error) {
    logger.error('Error processing live photo image for facial recognition:', error);
    return null;
  } finally {
    if (tensor) {
      tensor.dispose();
    }
  }
}
