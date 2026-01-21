import { randomUUID } from 'node:crypto';
import type { Quad_Subject, Term } from '@rdfjs/types';
import { DataFactory as DF, Store } from 'n3';
import type { ConflictResolverInput, ConflictResolverOutput } from './ConflictResolver';
import { ConflictResolver } from './ConflictResolver';
import { FORCE, RDF } from './Vocabularies';

/**
 * A {@link ConflictResolver} that prioritizes prohibition reports.
 * If there is at least one prohibition report in the input, the result will be a Deny.
 * If there are no prohibition/permission reports in the input, the result will also be a Deny.
 * If there is at least one permission, and no prohibitions, the result will be an Allow.
 */
export class DenyConflictResolver extends ConflictResolver {
  public async handle({ reports }: ConflictResolverInput): Promise<ConflictResolverOutput> {
    let permission: Quad_Subject | undefined;
    let prohibition: Quad_Subject | undefined;
    let finalReport: Store | undefined;
    for (const { report } of reports) {
      const store = new Store(report);
      const prohibitions = store.getSubjects(RDF.terms.type, FORCE.terms.ProhibitionReport, null);
      if (prohibitions.length > 0) {
        prohibition = prohibitions[0];
        finalReport = store;
        break;
      }

      const permissions = store.getSubjects(RDF.terms.type, FORCE.terms.PermissionReport, null);
      if (permissions.length > 0) {
        permission = permissions[0];
        finalReport = store;
      }
    }

    // The action is allowed if there is no prohibition and at least one permission
    const conclusion = prohibition ?? !permission ? FORCE.terms.Deny : FORCE.terms.Allow;
    const reason = prohibition ?? permission ?? FORCE.terms.NoValidRule;

    const identifier = DF.namedNode(`urn:uuid:${randomUUID()}`);
    const report = [
      DF.quad(identifier, RDF.terms.type, FORCE.terms.ConflictReport),
      DF.quad(identifier, FORCE.terms.algorithm, FORCE.terms.PrioritizeDeny),
      DF.quad(identifier, FORCE.terms.conclusion, conclusion),
      DF.quad(identifier, FORCE.terms.reason, reason),
    ];

    if (finalReport) {
      // Having a report means a prohibition or permission is defined
      const policyReport = this.getPolicyReport(finalReport, (prohibition ?? permission)!);
      if (policyReport) {
        report.push(DF.quad(identifier, FORCE.terms.policyReport, policyReport));
      }
      report.push(...finalReport.getQuads(null, null, null, null));
    }

    return { identifier, report };
  }

  protected getPolicyReport(data: Store, childReport: Term): Quad_Subject | undefined {
    const subjects = data.getSubjects(FORCE.terms.ruleReport, childReport, null);
    if (subjects.length > 0) {
      return subjects[0];
    }
  }
}
