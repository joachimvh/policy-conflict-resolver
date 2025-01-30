import type { Quad } from '@rdfjs/types';
import { AsyncHandler } from 'asynchronous-handlers';

export interface PolicyExtractorArgs {
  /**
   * A collection of policy quads.
   */
  policies: Quad[];
}

/**
 * Can extract individual policy from a collection of policy data.
 *
 * @returns An array containing an entry for every individual policy that could be extracted.
 */
export abstract class PolicyExtractor extends AsyncHandler<PolicyExtractorArgs, Quad[][]> {}
