import type { Quad } from '@rdfjs/types';
import { DataFactory as DF } from 'n3';
import type { ConflictResolverInput, ConflictResolverOutput } from './ConflictResolver';
import { ConflictResolver } from './ConflictResolver';
import { REPORT } from './Vocabularies';

/**
 * An {@link ConflictResolver} that filters out inactive reports
 * and only sends the active reports to its source resolver.
 */
export class ActiveConflictResolver extends ConflictResolver {
  protected readonly cache: WeakMap<ConflictResolverInput, { policy: Quad[]; report: Quad[] }[]> = new WeakMap();

  public constructor(
    protected readonly resolver: ConflictResolver,
  ) {
    super();
  }

  public async canHandle(input: ConflictResolverInput): Promise<void> {
    const activeReports = input.reports.filter(({ report }): boolean =>
      report.some((quad): boolean =>
        quad.predicate.equals(REPORT.terms.activationState) && quad.object.equals(REPORT.terms.Active)));
    await this.resolver.canHandle({ reports: activeReports });
    this.cache.set(input, activeReports);
  }

  public async handle(input: ConflictResolverInput): Promise<ConflictResolverOutput> {
    const reports = this.cache.get(input);
    if (!reports) {
      throw new Error(`Trying to call handle before a successful canHandle call.`);
    }
    const result = await this.resolver.handle({ reports });

    result.report.push(
      DF.quad(result.identifier, REPORT.terms.algorithm, REPORT.terms.OnlyActiveRules),
    );

    return result;
  }
}
