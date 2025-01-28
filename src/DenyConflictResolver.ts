import { randomUUID } from 'node:crypto';
import type { Quad, Quad_Subject, Term } from '@rdfjs/types';
import { DataFactory as DF, Store } from 'n3';
import type { ConflictResolver } from './ConflictResolver';
import { RDF, REPORT } from './Vocabularies';

/**
 * A {@link ConflictResolver} that prioritizes prohibition reports.
 * If there is at least one active prohibition report in the input, the result will be a Deny.
 * If there are no active reports in the input, the result will also be a Deny.
 * If there is at least one active permission, and no active prohibitions, the result will be an Allow.
 */
export class DenyConflictResolver implements ConflictResolver {
  public async resolve(reports: { policy: Quad[]; report: Quad[] }[]): Promise<Quad[]> {
    let permission: Quad_Subject | undefined;
    let prohibition: Quad_Subject | undefined;
    let activeReport: Store | undefined;
    for (const { report } of reports) {
      const store = new Store(report);
      for (const subject of store.getSubjects(RDF.terms.type, REPORT.terms.ProhibitionReport, null)) {
        if (store.countQuads(subject, REPORT.terms.activationState, REPORT.terms.Active, null) > 0) {
          prohibition = subject;
          activeReport = store;
          break;
        }
      }

      if (!prohibition && !permission) {
        for (const subject of store.getSubjects(RDF.terms.type, REPORT.terms.PermissionReport, null)) {
          if (store.countQuads(subject, REPORT.terms.activationState, REPORT.terms.Active, null) > 0) {
            permission = subject;
            activeReport = store;
            break;
          }
        }
      }
    }

    // The action is allowed if there is no prohibition and at least one permission
    const conclusion = prohibition ?? !permission ? REPORT.terms.Deny : REPORT.terms.Allow;
    const reason = prohibition ?? permission ?? REPORT.terms.NoActiveRule;

    const reportSubject = DF.namedNode(`urn:uuid:${randomUUID()}`);
    const report = [
      DF.quad(reportSubject, RDF.terms.type, REPORT.terms.ConflictReport),
      DF.quad(reportSubject, REPORT.terms.algorithm, REPORT.terms.PrioritizeDeny),
      DF.quad(reportSubject, REPORT.terms.conclusion, conclusion),
      DF.quad(reportSubject, REPORT.terms.reason, reason),
    ];

    if (activeReport) {
      // Having an active report means a prohibition or permission is defined
      const policyReport = this.getPolicyReport(activeReport, (prohibition ?? permission)!);
      if (policyReport) {
        report.push(DF.quad(reportSubject, REPORT.terms.policyReport, policyReport));
      }
      report.push(...activeReport.getQuads(null, null, null, null));
    }

    return report;
  }

  protected getPolicyReport(data: Store, childReport: Term): Quad_Subject | undefined {
    const subjects = data.getSubjects(REPORT.terms.ruleReport, childReport, null);
    if (subjects.length > 0) {
      return subjects[0];
    }
  }
}
