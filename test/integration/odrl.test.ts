import type { Quad } from '@rdfjs/types';
import { DataFactory as DF, Store } from 'n3';
import { ODRLEngineMultipleSteps, ODRLEvaluator } from 'odrl-evaluator';
import { ActiveConflictResolver } from '../../src/ActiveConflictResolver';
import { ConflictEvaluator } from '../../src/ConflictEvaluator';
import { DenyConflictResolver } from '../../src/DenyConflictResolver';
import { OdrlPolicyExtractor } from '../../src/OdrlPolicyExtractor';
import { PriorityConflictResolver } from '../../src/PriorityConflictResolver';
import { CODRL, FORCE, ODRL, RDF } from '../../src/Vocabularies';
import { WrappedEvaluatorHandler } from '../../src/WrappedEvaluatorHandler';
import { defaultAction, defaultTarget, generatePolicies } from '../util/Util';

// Not fully integration as we do use a mock for the source evaluator.
// So currently the permission extractor is not being tested here.
describe('A full ODRL setup', (): void => {
  const request: Quad[] = [
    DF.quad(DF.namedNode(`urn:uuid:1`), RDF.terms.type, ODRL.terms.Request),
    DF.quad(DF.namedNode(`urn:uuid:1`), ODRL.terms.permission, DF.namedNode(`urn:uuid:2`)),
    DF.quad(DF.namedNode(`urn:uuid:2`), ODRL.terms.action, defaultAction),
    DF.quad(DF.namedNode(`urn:uuid:2`), ODRL.terms.target, defaultTarget),
  ];
  const state: Quad[] = [
    DF.quad(
      DF.namedNode('http://example.com/request/currentTime'),
      DF.namedNode('http://purl.org/dc/terms/issued'),
      DF.literal('2024-02-12T11:20:10.999Z', DF.namedNode('http://www.w3.org/2001/XMLSchema#dateTime')),
    ),
  ];
  const extractor = new OdrlPolicyExtractor();
  const source = new WrappedEvaluatorHandler(new ODRLEvaluator(new ODRLEngineMultipleSteps()));
  const resolver = new ActiveConflictResolver(new PriorityConflictResolver(new DenyConflictResolver()));
  const evaluator = new ConflictEvaluator(extractor, source, resolver);

  it('rejects the request if there are no active policies.', async(): Promise<void> => {
    const policies = generatePolicies({ permission: { wrong: [ null ]}, prohibition: { wrong: [ null ]}});
    const report = new Store(await evaluator.evaluate(policies, request, state));
    expect(report.countQuads(null, RDF.terms.type, FORCE.terms.ConflictReport, null)).toBe(1);
    const subject = report.getSubjects(RDF.terms.type, FORCE.terms.ConflictReport, null)[0];
    expect(report.countQuads(subject, FORCE.terms.algorithm, FORCE.terms.PrioritizeDeny, null)).toBe(1);
    expect(report.countQuads(subject, FORCE.terms.algorithm, FORCE.terms.HighestPriority, null)).toBe(0);
    expect(report.countQuads(subject, FORCE.terms.algorithm, FORCE.terms.OnlyActiveRules, null)).toBe(1);
    expect(report.countQuads(subject, FORCE.terms.conclusion, FORCE.terms.Deny, null)).toBe(1);
    expect(report.countQuads(subject, FORCE.terms.reason, FORCE.terms.NoValidRule, null)).toBe(1);
    expect(report.countQuads(subject, FORCE.terms.reason, FORCE.terms.policyReport, null)).toBe(0);
  });

  it('rejects the request if there is at least one active prohibition.', async(): Promise<void> => {
    const policies = generatePolicies({ permission: { match: [ null, null ]}, prohibition: { match: [ null, null ]}});
    const report = new Store(await evaluator.evaluate(policies, request, state));

    expect(report.countQuads(null, RDF.terms.type, FORCE.terms.ConflictReport, null)).toBe(1);
    const subject = report.getSubjects(RDF.terms.type, FORCE.terms.ConflictReport, null)[0];
    expect(report.countQuads(subject, FORCE.terms.algorithm, FORCE.terms.PrioritizeDeny, null)).toBe(1);
    expect(report.countQuads(subject, FORCE.terms.algorithm, FORCE.terms.HighestPriority, null)).toBe(0);
    expect(report.countQuads(subject, FORCE.terms.algorithm, FORCE.terms.OnlyActiveRules, null)).toBe(1);
    expect(report.countQuads(subject, FORCE.terms.conclusion, FORCE.terms.Deny, null)).toBe(1);
    expect(report.countQuads(subject, FORCE.terms.reason, null, null)).toBe(1);
    expect(report.countQuads(subject, FORCE.terms.policyReport, null, null)).toBe(1);
    expect(report.countQuads(null, RDF.terms.type, FORCE.terms.PolicyReport, null)).toBe(1);
    const reason = report.getObjects(subject, FORCE.terms.reason, null)[0];
    const policy = report.getObjects(subject, FORCE.terms.policyReport, null)[0];
    expect(report.countQuads(policy, FORCE.terms.ruleReport, reason, null)).toBe(1);
    expect(report.countQuads(reason, RDF.terms.type, FORCE.terms.ProhibitionReport, null)).toBe(1);
    expect(report.countQuads(reason, FORCE.terms.activationState, FORCE.terms.Active, null)).toBe(1);
  });

  it('accepts the request if there is no active prohibition and an active permission.', async(): Promise<void> => {
    const policies = generatePolicies({
      permission: { match: [ null ], wrong: [ null ]},
      prohibition: { wrong: [ null ]},
    });
    const report = new Store(await evaluator.evaluate(policies, request, state));

    expect(report.countQuads(null, RDF.terms.type, FORCE.terms.ConflictReport, null)).toBe(1);
    const subject = report.getSubjects(RDF.terms.type, FORCE.terms.ConflictReport, null)[0];
    expect(report.countQuads(subject, FORCE.terms.algorithm, FORCE.terms.PrioritizeDeny, null)).toBe(1);
    expect(report.countQuads(subject, FORCE.terms.algorithm, FORCE.terms.HighestPriority, null)).toBe(0);
    expect(report.countQuads(subject, FORCE.terms.algorithm, FORCE.terms.OnlyActiveRules, null)).toBe(1);
    expect(report.countQuads(subject, FORCE.terms.conclusion, FORCE.terms.Allow, null)).toBe(1);
    expect(report.countQuads(subject, FORCE.terms.reason, null, null)).toBe(1);
    expect(report.countQuads(subject, FORCE.terms.policyReport, null, null)).toBe(1);
    expect(report.countQuads(null, RDF.terms.type, FORCE.terms.PolicyReport, null)).toBe(1);
    const reason = report.getObjects(subject, FORCE.terms.reason, null)[0];
    const policy = report.getObjects(subject, FORCE.terms.policyReport, null)[0];
    expect(report.countQuads(policy, FORCE.terms.ruleReport, reason, null)).toBe(1);
    expect(report.countQuads(reason, RDF.terms.type, FORCE.terms.PermissionReport, null)).toBe(1);
    expect(report.countQuads(reason, FORCE.terms.activationState, FORCE.terms.Active, null)).toBe(1);
  });

  it('prioritizes requests with a higher priority.', async(): Promise<void> => {
    const policies = generatePolicies({
      permission: { match: [ 5 ], wrong: [ 6 ]},
      prohibition: { match: [ 4 ]},
    });

    // Find the rule that has priority 5
    const rule = policies.find(
      (quad): boolean => quad.predicate.equals(CODRL.terms.priority) && quad.object.value === '5',
    )!.subject;

    const report = new Store(await evaluator.evaluate(policies, request, state));

    expect(report.countQuads(null, RDF.terms.type, FORCE.terms.ConflictReport, null)).toBe(1);
    const subject = report.getSubjects(RDF.terms.type, FORCE.terms.ConflictReport, null)[0];
    expect(report.countQuads(subject, FORCE.terms.algorithm, FORCE.terms.PrioritizeDeny, null)).toBe(1);
    expect(report.countQuads(subject, FORCE.terms.algorithm, FORCE.terms.HighestPriority, null)).toBe(1);
    expect(report.countQuads(subject, FORCE.terms.algorithm, FORCE.terms.OnlyActiveRules, null)).toBe(1);
    expect(report.countQuads(subject, FORCE.terms.conclusion, FORCE.terms.Allow, null)).toBe(1);
    expect(report.countQuads(subject, FORCE.terms.reason, null, null)).toBe(1);
    expect(report.countQuads(subject, FORCE.terms.policyReport, null, null)).toBe(1);
    expect(report.countQuads(null, RDF.terms.type, FORCE.terms.PolicyReport, null)).toBe(1);
    const reason = report.getObjects(subject, FORCE.terms.reason, null)[0];
    const policy = report.getObjects(subject, FORCE.terms.policyReport, null)[0];
    expect(report.countQuads(policy, FORCE.terms.ruleReport, reason, null)).toBe(1);
    expect(report.countQuads(reason, RDF.terms.type, FORCE.terms.PermissionReport, null)).toBe(1);
    expect(report.countQuads(reason, FORCE.terms.activationState, FORCE.terms.Active, null)).toBe(1);
    // Verify that the expected rule is part of the reason
    expect(report.countQuads(reason, FORCE.terms.rule, rule, null)).toBe(1);
  });
});
