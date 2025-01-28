import type { Quad } from '@rdfjs/types';

/**
 * A policy evaluator. Returns a report indicating the result.
 */
export interface Evaluator {
  /**
   * Based on a set of policies, a formal description of the world,
   * and, in the case of access control, an access control,
   * determine whether the usage of data was and is permitted
   * and whether all obligations have been met.
   *
   * @param policy - A Usage Control Policy (represented in RDF).
   * @param request - An Access Control Request (represented in RDF).
   * @param state - The state of the world (represented in RDF).
   *
   * @returns A conformance report
   */
  evaluate: (policy: Quad[], request: Quad[], state: Quad[]) => Promise<Quad[]>;
}
