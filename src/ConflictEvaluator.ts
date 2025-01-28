import type { Quad } from '@rdfjs/types';
import type { ConflictResolver } from './ConflictResolver';
import type { Evaluator } from './Evaluator';
import type { PolicyExtractor } from './PolicyExtractor';

/**
 * An {@link Evaluator} that combines multiple policy reports.
 * First it extracts all individual policies using a {@link PolicyExtractor}.
 * These then get fed into the source {@link Evaluator} one by one.
 * The resulting reports get fed into a {@link ConflictResolver} to generate the final report.
 */
export class ConflictEvaluator implements Evaluator {
  public constructor(
    protected readonly extractor: PolicyExtractor,
    protected readonly evaluator: Evaluator,
    protected readonly resolver: ConflictResolver,
  ) {}

  public async evaluate(policy: Quad[], request: Quad[], state: Quad[]): Promise<Quad[]> {
    const policies = await this.extractor.extract(policy);
    const reports = await Promise.all(
      policies.map(async(pol): Promise<{ policy: Quad[]; report: Quad[] }> => ({
        policy: pol,
        report: await this.evaluator.evaluate(pol, request, state),
      })),
    );

    return this.resolver.resolve(reports);
  }
}
