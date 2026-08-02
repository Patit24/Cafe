import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-wasm';
import * as faceapi from '@vladmandic/face-api/dist/face-api.node-wasm.js';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';
import { Logger } from '@nestjs/common';

const logger = new Logger('ServerFaceEngine');
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

let modelsLoaded = false;
let loadingPromise: Promise<boolean> | null = null;

export async function initServerFaceEngine(): Promise<boolean> {
  if (modelsLoaded) return true;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      logger.log('Initializing TF.js with WASM backend...');
      await tf.setBackend('wasm');
      await tf.ready();
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
  // Strict threshold: <= 0.50 distance passes (75% score or higher)
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
  if (!ready) {
    logger.error('Cannot extract face vector because models failed to load.');
    return null;
  }

  let tensor: tf.Tensor3D | null = null;
  try {
    // 1. Strip Data URL prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    let width: number;
    let height: number;
    let rgbData: Uint8Array;

    // 2. Detect format (PNG vs JPEG) and decode to RGB Uint8Array
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      // PNG Image
      const png = PNG.sync.read(buffer);
      width = png.width;
      height = png.height;
      rgbData = new Uint8Array(width * height * 3);
      let idx = 0;
      for (let i = 0; i < png.data.length; i += 4) {
        rgbData[idx++] = png.data[i];     // R
        rgbData[idx++] = png.data[i + 1]; // G
        rgbData[idx++] = png.data[i + 2]; // B
      }
    } else {
      // JPEG Image (or default)
      const raw = jpeg.decode(buffer, { useTArray: true });
      width = raw.width;
      height = raw.height;
      rgbData = new Uint8Array(width * height * 3);
      let idx = 0;
      for (let i = 0; i < raw.data.length; i += 4) {
        rgbData[idx++] = raw.data[i];     // R
        rgbData[idx++] = raw.data[i + 1]; // G
        rgbData[idx++] = raw.data[i + 2]; // B
      }
    }

    // 3. Create TensorFlow RGB Tensor
    tensor = tf.tensor3d(rgbData, [height, width, 3], 'int32') as tf.Tensor3D;

    // 4. Detect single face and extract embedding vector
    let result = await faceapi
      .detectSingleFace(tensor as any, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!result) {
      // Fallback to TinyFaceDetector
      result = await faceapi
        .detectSingleFace(tensor as any, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.2 }))
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
