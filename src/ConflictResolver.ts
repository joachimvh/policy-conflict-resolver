import type { Quad, Quad_Subject } from '@rdfjs/types';
import { AsyncHandler } from 'asynchronous-handlers';

export interface ConflictResolverInput {
  /**
   * Reports generated by an Evaluator, together with the corresponding policy.
   */
  reports: { policy: Quad[]; report: Quad[] }[];
}

export interface ConflictResolverOutput {
  /**
   * The identifier of the output report.
   */
  identifier: Quad_Subject;
  /**
   * The output report.
   */
  report: Quad[];
}

/**
 * Generates a report based on multiple input reports.
 * How the conflicts between multiple reports get resolved depend on the implemented algorithm.
 *
 * @returns A single report that aggregates the input reports into a single result.
 */
export abstract class ConflictResolver extends AsyncHandler<ConflictResolverInput, ConflictResolverOutput> {}
