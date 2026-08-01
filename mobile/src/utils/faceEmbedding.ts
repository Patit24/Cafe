/**
 * Face Embedding Vector Utility
 * Computes 512-dimensional face feature vectors and Cosine Similarity
 */

export type FaceEmbedding = number[];

/**
 * Calculates Cosine Similarity between two 512-dimensional vectors.
 * Returns similarity score between 0.0 and 1.0 (or percentage 0-100%).
 */
export function calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (!vectorA || !vectorB || vectorA.length !== vectorB.length || vectorA.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  if (normA === 0 || normB === 0) return 0;

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, similarity));
}

/**
 * Compares a live face embedding against 4 registered angle embeddings.
 * Returns highest match percentage (0 - 100%).
 */
export function getHighestMatchScore(
  liveEmbedding: number[],
  registeredEmbeddings: (number[] | null | undefined)[]
): { highestScore: number; bestAngleIndex: number } {
  let highestScore = 0;
  let bestAngleIndex = -1;

  registeredEmbeddings.forEach((registeredVector, index) => {
    if (registeredVector && registeredVector.length > 0) {
      const sim = calculateCosineSimilarity(liveEmbedding, registeredVector);
      const scorePercentage = Math.round(sim * 10000) / 100; // e.g. 94.3%
      if (scorePercentage > highestScore) {
        highestScore = scorePercentage;
        bestAngleIndex = index;
      }
    }
  });

  return { highestScore, bestAngleIndex };
}

/**
 * Generates a deterministic 512-dimensional vector embedding from image URI / seed string
 * for testing and verification consistency.
 */
export function generate512dEmbedding(seedStr: string): number[] {
  const vector: number[] = new Array(512);
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }

  let magnitude = 0;
  for (let i = 0; i < 512; i++) {
    const val = Math.sin(hash + i * 0.1) * Math.cos(i * 0.05);
    vector[i] = val;
    magnitude += val * val;
  }

  // Normalize vector to unit length
  const norm = Math.sqrt(magnitude);
  for (let i = 0; i < 512; i++) {
    vector[i] = vector[i] / norm;
  }

  return vector;
}
