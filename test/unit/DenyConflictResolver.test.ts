import type { Quad } from '@rdfjs/types';
import { DataFactory as DF, Store } from 'n3';
import { DenyConflictResolver } from '../../src/DenyConflictResolver';
import { FORCE, RDF } from '../../src/Vocabularies';

function generateRuleReport(permission: boolean, urnId = 0): Quad[] {
  const policy = DF.namedNode(`urn:policy:${urnId}`);
  const rule = DF.namedNode(`urn:rule:${urnId}`);
  const type = permission ? FORCE.terms.PermissionReport : FORCE.terms.ProhibitionReport;
  return [
    DF.quad(policy, FORCE.terms.ruleReport, rule),
    DF.quad(rule, RDF.terms.type, type),
  ];
}

describe('DenyConflictResolver', (): void => {
  const resolver = new DenyConflictResolver();

  it('generates a deny report if there is a prohibition.', async(): Promise<void> => {
    const report = new Store((await resolver.handleSafe({ reports: [
      { policy: [], report: generateRuleReport(true, 0) },
      { policy: [], report: generateRuleReport(false, 1) },
    ]})).report);
    expect(report.countQuads(null, RDF.terms.type, FORCE.terms.ConflictReport, null)).toBe(1);
    const subject = report.getSubjects(RDF.terms.type, FORCE.terms.ConflictReport, null)[0];
    expect(report.countQuads(subject, FORCE.terms.algorithm, FORCE.terms.PrioritizeDeny, null)).toBe(1);
    expect(report.countQuads(subject, FORCE.terms.conclusion, FORCE.terms.Deny, null)).toBe(1);
    expect(report.countQuads(subject, FORCE.terms.reason, null, null)).toBe(1);
    expect(report.countQuads(subject, FORCE.terms.policyReport, null, null)).toBe(1);
    const reason = report.getObjects(subject, FORCE.terms.reason, null)[0];
    const policy = report.getObjects(subject, FORCE.terms.policyReport, null)[0];
    expect(reason.value).toBe(`urn:rule:1`);
    expect(policy.value).toBe(`urn:policy:1`);
  });

  it('generates a deny report if there are no rules.', async(): Promise<void> => {
    const report = new Store((await resolver.handleSafe({ reports: []})).report);
    expect(report.countQuads(null, RDF.terms.type, FORCE.terms.ConflictReport, null)).toBe(1);
    const subject = report.getSubjects(RDF.terms.type, FORCE.terms.ConflictReport, null)[0];
    expect(report.countQuads(subject, FORCE.terms.algorithm, FORCE.terms.PrioritizeDeny, null)).toBe(1);
    expect(report.countQuads(subject, FORCE.terms.conclusion, FORCE.terms.Deny, null)).toBe(1);
    expect(report.countQuads(subject, FORCE.terms.reason, FORCE.terms.NoValidRule, null)).toBe(1);
    expect(report.countQuads(subject, FORCE.terms.policyReport, null, null)).toBe(0);
  });

  it('generates an allow report if there is a permission and no prohibition.', async(): Promise<void> => {
    const report = new Store((await resolver.handleSafe({ reports: [
      { policy: [], report: generateRuleReport(true, 0) },
    ]})).report);
    expect(report.countQuads(null, RDF.terms.type, FORCE.terms.ConflictReport, null)).toBe(1);
    const subject = report.getSubjects(RDF.terms.type, FORCE.terms.ConflictReport, null)[0];
    expect(report.countQuads(subject, FORCE.terms.algorithm, FORCE.terms.PrioritizeDeny, null)).toBe(1);
    expect(report.countQuads(subject, FORCE.terms.conclusion, FORCE.terms.Allow, null)).toBe(1);
    expect(report.countQuads(subject, FORCE.terms.reason, null, null)).toBe(1);
    expect(report.countQuads(subject, FORCE.terms.policyReport, null, null)).toBe(1);
    const reason = report.getObjects(subject, FORCE.terms.reason, null)[0];
    const policy = report.getObjects(subject, FORCE.terms.policyReport, null)[0];
    expect(reason.value).toBe(`urn:rule:0`);
    expect(policy.value).toBe(`urn:policy:0`);
  });
});
