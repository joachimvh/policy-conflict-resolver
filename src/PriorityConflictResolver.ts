import type { Quad } from '@rdfjs/types';
import { DataFactory as DF, Store } from 'n3';
import type { ConflictResolverInput, ConflictResolverOutput } from './ConflictResolver';
import { ConflictResolver } from './ConflictResolver';
import { CODRL, REPORT } from './Vocabularies';

/**
 * A {@link ConflictResolver} that finds that, for all input policy/report combinations,
 * finds the policies with the highest `urn:example:custom:odrl:priority` value.
 * Only those policy/report combinations get sent to the source resolver.
 *
 * Currently, there is no `canHandle` implementation, implying it can handle everything.
 *
 * In case some reports do not have a priority,
 * processing is halted and the entire input is sent to the source resolver.
 * If the  `PriorityConflictResolver` is instantiated with `setDefaultPriority` set to true,
 * those reports will instead default to priority `0` and be interpreted as such.
 */
export class PriorityConflictResolver extends ConflictResolver {
  public constructor(
    protected readonly resolver: ConflictResolver,
    protected readonly setDefaultPriority = false,
  ) {
    super();
  }

  public async handle(input: ConflictResolverInput): Promise<ConflictResolverOutput> {
    if (input.reports.length === 0) {
      // Nothing left to filter so letting the source resolver handle an empty array.
      return this.resolver.handleSafe({ reports: []});
    }
    const reportStores = input.reports.map(({ policy, report }): { policy: Store; report: Store } =>
      ({ policy: new Store(policy), report: new Store(report) }));

    let missingPriority = false;
    const priorityReports = reportStores.map(({ policy, report }):
    { policy: Store; report: Store; priority?: number } => {
      const objects = policy.getObjects(null, CODRL.terms.priority, null);
      if (objects.length > 1) {
        throw new Error('Unexpected input with multiple priorities');
      }
      let priority: number | undefined;
      if (objects.length === 1) {
        const number = Number.parseFloat(objects[0].value);
        if (!Number.isNaN(number)) {
          priority = number;
        }
      } else {
        missingPriority = true;
      }
      return { policy, report, priority };
    });

    // Can't handle the priorities as some of them are missing, letting the source resolver handle everything.
    if (missingPriority && !this.setDefaultPriority) {
      return this.resolver.handleSafe(input);
    }

    let highestPriority = Number.NEGATIVE_INFINITY;
    let highestPriorityReports: { policy: Store; report: Store }[] = [];
    for (const report of priorityReports) {
      const priority = report.priority ?? 0;
      if (priority > highestPriority) {
        highestPriorityReports = [];
        highestPriority = priority;
      }
      if (priority === highestPriority) {
        highestPriorityReports.push(report);
      }
    }

    const result = await this.resolver.handleSafe({
      reports: highestPriorityReports.map(({ policy, report }): { policy: Quad[]; report: Quad[] } =>
        ({ policy: policy.getQuads(null, null, null, null), report: report.getQuads(null, null, null, null) })),
    });

    result.report.push(
      DF.quad(result.identifier, REPORT.terms.algorithm, REPORT.terms.HighestPriority),
    );

    return result;
  }
}
