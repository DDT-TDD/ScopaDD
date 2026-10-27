/**
 * Fast, seedable, deterministic 32-bit PRNG (Mulberry32).
 * Given the same numeric seed, it produces identical sequences across all platforms.
 */
export class PRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Returns a pseudorandom 32-bit unsigned integer */
  nextUint32(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  }

  /** Returns a pseudorandom float in [0, 1) */
  nextFloat(): number {
    return this.nextUint32() / 4294967296;
  }

  /** Returns an integer in [min, max] inclusive */
  nextInt(min: number, max: number): number {
    return min + Math.floor(this.nextFloat() * (max - min + 1));
  }

  /** Shuffles an array in place using the Fisher-Yates algorithm */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  }
}

/** Generate a random 32-bit seed */
export function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}
