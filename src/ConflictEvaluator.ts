import type { Quad } from '@rdfjs/types';
import type { ConflictResolver } from './ConflictResolver';
import type { Evaluator } from './Evaluator';
import type { EvaluatorHandler } from './EvaluatorHandler';
import type { PolicyExtractor } from './PolicyExtractor';

/**
 * An {@link Evaluator} that combines multiple policy reports.
 * First it extracts all individual policies using a {@link PolicyExtractor}.
 * These then get fed into the source {@link EvaluatorHandler} one by one.
 * The resulting reports get fed into a {@link ConflictResolver} to generate the final report.
 */
export class ConflictEvaluator implements Evaluator {
  public constructor(
    protected readonly extractor: PolicyExtractor,
    protected readonly evaluator: EvaluatorHandler,
    protected readonly resolver: ConflictResolver,
  ) {}

  public async evaluate(policies: Quad[], request: Quad[], state: Quad[]): Promise<Quad[]> {
    const policyList = await this.extractor.handleSafe({ policies });
    const reports = await Promise.all(
      policyList.map(async(policy): Promise<{ policy: Quad[]; report: Quad[] }> => ({
        policy,
        report: await this.evaluator.handleSafe({ policy, request, state }),
      })),
    );

    return this.resolver.handleSafe({ reports });
  }
}
