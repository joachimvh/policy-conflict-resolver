import 'jest-rdf';
import type { Quad } from '@rdfjs/types';
import { DataFactory as DF } from 'n3';
import type { ConflictResolver, ConflictResolverOutput } from '../../src/ConflictResolver';
import { PriorityConflictResolver } from '../../src/PriorityConflictResolver';
import { CODRL, RDF, REPORT } from '../../src/Vocabularies';

describe('PriorityConflictResolver', (): void => {
  const response: ConflictResolverOutput = {
    identifier: DF.namedNode('response'),
    report: [ DF.quad(DF.namedNode('response'), RDF.terms.type, REPORT.terms.ConflictReport) ],
  };
  let reports: { policy: Quad[]; report: Quad[] }[];
  let source: jest.Mocked<ConflictResolver>;
  let resolver: PriorityConflictResolver;

  beforeEach(async(): Promise<void> => {
    reports = [];

    source = {
      canHandle: jest.fn(),
      handle: jest.fn(),
      handleSafe: jest.fn().mockResolvedValue(response),
    };

    resolver = new PriorityConflictResolver(source);
  });

  it('calls the source with the highest priority policies.', async(): Promise<void> => {
    reports.push({
      policy: [ DF.quad(DF.namedNode('1'), CODRL.terms.priority, DF.literal(4)) ],
      report: [ DF.quad(DF.namedNode('2'), RDF.terms.type, REPORT.terms.ConflictReport) ],
    });
    reports.push({
      policy: [ DF.quad(DF.namedNode('3'), CODRL.terms.priority, DF.literal(3)) ],
      report: [ DF.quad(DF.namedNode('4'), RDF.terms.type, REPORT.terms.ConflictReport) ],
    });

    const result = await resolver.handle({ reports });
    expect(result.report).toBeRdfIsomorphic([
      ...response.report,
      DF.quad(response.identifier, REPORT.terms.algorithm, REPORT.terms.HighestPriority),
    ]);
    expect(result.identifier).toEqualRdfTerm(response.identifier);
    expect(source.handleSafe).toHaveBeenCalledTimes(1);
    expect(source.handleSafe.mock.lastCall![0].reports).toHaveLength(1);
    expect(source.handleSafe.mock.lastCall![0].reports[0].policy).toBeRdfIsomorphic(reports[0].policy);
    expect(source.handleSafe.mock.lastCall![0].reports[0].report).toBeRdfIsomorphic(reports[0].report);
  });

  it('calls the source immediately if there are no input reports.', async(): Promise<void> => {
    const result = await resolver.handle({ reports });
    expect(result.report).toBeRdfIsomorphic(response.report);
  });

  it('sends all reports to the source if some of them have no priority.', async(): Promise<void> => {
    reports.push({
      policy: [ DF.quad(DF.namedNode('1'), CODRL.terms.priority, DF.literal(4)) ],
      report: [ DF.quad(DF.namedNode('2'), RDF.terms.type, REPORT.terms.ConflictReport) ],
    });
    reports.push({
      policy: [ DF.quad(DF.namedNode('3'), CODRL.terms.priority, DF.literal(3)) ],
      report: [ DF.quad(DF.namedNode('4'), RDF.terms.type, REPORT.terms.ConflictReport) ],
    });
    reports.push({
      policy: [ ],
      report: [ DF.quad(DF.namedNode('6'), RDF.terms.type, REPORT.terms.ConflictReport) ],
    });

    const result = await resolver.handle({ reports });
    expect(result.report).toBeRdfIsomorphic(response.report);
    expect(result.identifier).toEqualRdfTerm(response.identifier);
    expect(source.handleSafe).toHaveBeenCalledTimes(1);
    expect(source.handleSafe).toHaveBeenLastCalledWith({ reports });
  });

  it('errors if a policy has multiple priorities.', async(): Promise<void> => {
    reports.push({
      policy: [
        DF.quad(DF.namedNode('1'), CODRL.terms.priority, DF.literal(4)),
        DF.quad(DF.namedNode('1'), CODRL.terms.priority, DF.literal(5)),
      ],
      report: [ DF.quad(DF.namedNode('2'), RDF.terms.type, REPORT.terms.ConflictReport) ],
    });

    await expect(resolver.handle({ reports })).rejects.toThrow('Unexpected input with multiple priorities');
  });

  it('can be configured to default policies to priority 0.', async(): Promise<void> => {
    reports.push({
      policy: [ DF.quad(DF.namedNode('1'), CODRL.terms.priority, DF.literal(-4)) ],
      report: [ DF.quad(DF.namedNode('2'), RDF.terms.type, REPORT.terms.ConflictReport) ],
    });
    reports.push({
      policy: [ DF.quad(DF.namedNode('3'), CODRL.terms.priority, DF.literal(-3)) ],
      report: [ DF.quad(DF.namedNode('4'), RDF.terms.type, REPORT.terms.ConflictReport) ],
    });
    reports.push({
      policy: [ ],
      report: [ DF.quad(DF.namedNode('6'), RDF.terms.type, REPORT.terms.ConflictReport) ],
    });

    resolver = new PriorityConflictResolver(source, true);
    const result = await resolver.handle({ reports });
    expect(result.report).toBeRdfIsomorphic(response.report);
    expect(result.identifier).toEqualRdfTerm(response.identifier);
    expect(source.handleSafe).toHaveBeenCalledTimes(1);
    expect(source.handleSafe.mock.lastCall![0].reports).toHaveLength(1);
    expect(source.handleSafe.mock.lastCall![0].reports[0].policy).toHaveLength(0);
    expect(source.handleSafe.mock.lastCall![0].reports[0].report).toBeRdfIsomorphic(reports[2].report);
  });
});
