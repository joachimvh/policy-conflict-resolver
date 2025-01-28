import type { Quad } from '@rdfjs/types';
import { DataFactory as DF } from 'n3';
import { ConflictEvaluator } from '../../src/ConflictEvaluator';
import type { ConflictResolver } from '../../src/ConflictResolver';
import type { Evaluator } from '../../src/Evaluator';
import type { PolicyExtractor } from '../../src/PolicyExtractor';
import { ODRL, RDF, REPORT } from '../../src/Vocabularies';

describe('ConflictEvaluator', (): void => {
  let extractor: jest.Mocked<PolicyExtractor>;
  let source: jest.Mocked<Evaluator>;
  let resolver: jest.Mocked<ConflictResolver>;
  let evaluator: ConflictEvaluator;

  beforeEach(async(): Promise<void> => {
    extractor = {
      extract: jest.fn(),
    };
    source = {
      evaluate: jest.fn(),
    };
    resolver = {
      resolve: jest.fn(),
    };

    evaluator = new ConflictEvaluator(extractor, source, resolver);
  });

  it('chains its components.', async(): Promise<void> => {
    const policy: Quad[] = [ DF.quad(DF.namedNode('urn:pol'), RDF.terms.type, ODRL.terms.Set) ];
    const request: Quad[] = [ DF.quad(DF.namedNode('urn:req'), RDF.terms.type, ODRL.terms.Request) ];
    const state: Quad[] = [ DF.quad(
      DF.namedNode('urn:time'),
      DF.namedNode('http://purl.org/dc/terms/issued'),
      DF.literal('2024-02-12T11:20:10.999Z', DF.namedNode('http://www.w3.org/2001/XMLSchema#dateTime')),
    ) ];

    extractor.extract.mockResolvedValue([
      [ DF.quad(DF.namedNode('urn:1'), RDF.terms.type, ODRL.terms.Set) ],
      [ DF.quad(DF.namedNode('urn:2'), RDF.terms.type, ODRL.terms.Set) ],
    ]);
    source.evaluate.mockResolvedValueOnce(
      [ DF.quad(DF.namedNode('urn:3'), RDF.terms.type, REPORT.terms.PolicyReport) ],
    );
    source.evaluate.mockResolvedValueOnce(
      [ DF.quad(DF.namedNode('urn:4'), RDF.terms.type, REPORT.terms.PolicyReport) ],
    );
    resolver.resolve.mockResolvedValue(
      [ DF.quad(DF.namedNode('urn:5'), RDF.terms.type, REPORT.terms.ConflictReport) ],
    );

    const report = await evaluator.evaluate(policy, request, state);
    expect(report).toEqual([ DF.quad(DF.namedNode('urn:5'), RDF.terms.type, REPORT.terms.ConflictReport) ]);
    expect(extractor.extract).toHaveBeenCalledTimes(1);
    expect(extractor.extract).toHaveBeenLastCalledWith(policy);
    expect(source.evaluate).toHaveBeenCalledTimes(2);
    expect(source.evaluate)
      .toHaveBeenNthCalledWith(1, [ DF.quad(DF.namedNode('urn:1'), RDF.terms.type, ODRL.terms.Set) ], request, state);
    expect(source.evaluate)
      .toHaveBeenNthCalledWith(2, [ DF.quad(DF.namedNode('urn:2'), RDF.terms.type, ODRL.terms.Set) ], request, state);
    expect(resolver.resolve).toHaveBeenCalledTimes(1);
    expect(resolver.resolve).toHaveBeenLastCalledWith([
      {
        policy: [ DF.quad(DF.namedNode('urn:1'), RDF.terms.type, ODRL.terms.Set) ],
        report: [ DF.quad(DF.namedNode('urn:3'), RDF.terms.type, REPORT.terms.PolicyReport) ],
      },
      {
        policy: [ DF.quad(DF.namedNode('urn:2'), RDF.terms.type, ODRL.terms.Set) ],
        report: [ DF.quad(DF.namedNode('urn:4'), RDF.terms.type, REPORT.terms.PolicyReport) ],
      },
    ]);
  });
});
