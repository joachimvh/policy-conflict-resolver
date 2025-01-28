import type { Quad } from '@rdfjs/types';

/**
 * Can extract individual policy from a collection of policy data.
 */
export interface PolicyExtractor {
  /**
   * Extracts all individual policies from the input policy data set.
   *
   * @param policies - A collection of policy quads.
   *
   * @returns An array containing an entry for every individual policy that could be extracted.
   */
  extract: (policies: Quad[]) => Promise<Quad[][]>;
}
