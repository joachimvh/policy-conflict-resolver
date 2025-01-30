import type { Quad } from '@rdfjs/types';
import { DataFactory as DF } from 'n3';
import { ConflictEvaluator } from '../../src/ConflictEvaluator';
import type { ConflictResolver } from '../../src/ConflictResolver';
import type { EvaluatorHandler } from '../../src/EvaluatorHandler';
import type { PolicyExtractor } from '../../src/PolicyExtractor';
import { ODRL, RDF, REPORT } from '../../src/Vocabularies';

describe('ConflictEvaluator', (): void => {
  let extractor: jest.Mocked<PolicyExtractor>;
  let source: jest.Mocked<EvaluatorHandler>;
  let resolver: jest.Mocked<ConflictResolver>;
  let evaluator: ConflictEvaluator;

  beforeEach(async(): Promise<void> => {
    extractor = {
      handleSafe: jest.fn(),
    } satisfies Partial<PolicyExtractor> as any;
    source = {
      handleSafe: jest.fn(),
    } satisfies Partial<EvaluatorHandler> as any;
    resolver = {
      handleSafe: jest.fn(),
    } satisfies Partial<ConflictResolver> as any;

    evaluator = new ConflictEvaluator(extractor, source, resolver);
  });

  it('chains its components.', async(): Promise<void> => {
    const policies: Quad[] = [ DF.quad(DF.namedNode('urn:pol'), RDF.terms.type, ODRL.terms.Set) ];
    const request: Quad[] = [ DF.quad(DF.namedNode('urn:req'), RDF.terms.type, ODRL.terms.Request) ];
    const state: Quad[] = [ DF.quad(
      DF.namedNode('urn:time'),
      DF.namedNode('http://purl.org/dc/terms/issued'),
      DF.literal('2024-02-12T11:20:10.999Z', DF.namedNode('http://www.w3.org/2001/XMLSchema#dateTime')),
    ) ];

    extractor.handleSafe.mockResolvedValue([
      [ DF.quad(DF.namedNode('urn:1'), RDF.terms.type, ODRL.terms.Set) ],
      [ DF.quad(DF.namedNode('urn:2'), RDF.terms.type, ODRL.terms.Set) ],
    ]);
    source.handleSafe.mockResolvedValueOnce(
      [ DF.quad(DF.namedNode('urn:3'), RDF.terms.type, REPORT.terms.PolicyReport) ],
    );
    source.handleSafe.mockResolvedValueOnce(
      [ DF.quad(DF.namedNode('urn:4'), RDF.terms.type, REPORT.terms.PolicyReport) ],
    );
    resolver.handleSafe.mockResolvedValue(
      [ DF.quad(DF.namedNode('urn:5'), RDF.terms.type, REPORT.terms.ConflictReport) ],
    );

    const report = await evaluator.evaluate(policies, request, state);
    expect(report).toEqual([ DF.quad(DF.namedNode('urn:5'), RDF.terms.type, REPORT.terms.ConflictReport) ]);
    expect(extractor.handleSafe).toHaveBeenCalledTimes(1);
    expect(extractor.handleSafe).toHaveBeenLastCalledWith({ policies });
    expect(source.handleSafe).toHaveBeenCalledTimes(2);
    expect(source.handleSafe).toHaveBeenNthCalledWith(
      1,
      { policy: [ DF.quad(DF.namedNode('urn:1'), RDF.terms.type, ODRL.terms.Set) ], request, state },
    );
    expect(source.handleSafe).toHaveBeenNthCalledWith(
      2,
      { policy: [ DF.quad(DF.namedNode('urn:2'), RDF.terms.type, ODRL.terms.Set) ], request, state },
    );
    expect(resolver.handleSafe).toHaveBeenCalledTimes(1);
    expect(resolver.handleSafe).toHaveBeenLastCalledWith({ reports: [
      {
        policy: [ DF.quad(DF.namedNode('urn:1'), RDF.terms.type, ODRL.terms.Set) ],
        report: [ DF.quad(DF.namedNode('urn:3'), RDF.terms.type, REPORT.terms.PolicyReport) ],
      },
      {
        policy: [ DF.quad(DF.namedNode('urn:2'), RDF.terms.type, ODRL.terms.Set) ],
        report: [ DF.quad(DF.namedNode('urn:4'), RDF.terms.type, REPORT.terms.PolicyReport) ],
      },
    ]});
  });
});
