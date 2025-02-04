import 'jest-rdf';
import { DataFactory as DF } from 'n3';
import { ActiveConflictResolver } from '../../src/ActiveConflictResolver';
import type { ConflictResolver, ConflictResolverInput } from '../../src/ConflictResolver';
import { RDF, REPORT } from '../../src/Vocabularies';

describe('ActiveConflictResolver', (): void => {
  const reports: ConflictResolverInput['reports'] = [{
    policy: [],
    report: [],
  }];
  const responseId = DF.namedNode('urn:uri');
  const response = [ DF.quad(responseId, RDF.terms.type, REPORT.terms.PolicyReport) ];
  let source: jest.Mocked<ConflictResolver>;
  let resolver: ActiveConflictResolver;

  beforeEach(async(): Promise<void> => {
    source = {
      canHandle: jest.fn(),
      handle: jest.fn().mockResolvedValue({ identifier: responseId, report: response }),
      handleSafe: jest.fn(),
    };

    resolver = new ActiveConflictResolver(source);
  });

  it('can handle input its source can handle.', async(): Promise<void> => {
    await expect(resolver.canHandle({ reports })).resolves.toBeUndefined();

    const error = new Error('bad data');
    source.canHandle.mockRejectedValueOnce(error);
    await expect(resolver.canHandle({ reports })).rejects.toThrow(error);
  });

  it('rejects handle requests without a preceding canHandle.', async(): Promise<void> => {
    await expect(resolver.handle({ reports }))
      .rejects.toThrow('Trying to call handle before a successful canHandle call.');
  });

  it('only sends the active reports to the source handler.', async(): Promise<void> => {
    const active: ConflictResolverInput['reports'][number] = {
      policy: [],
      report: [ DF.quad(DF.namedNode(''), REPORT.terms.activationState, REPORT.terms.Active) ],
    };
    const inactive: ConflictResolverInput['reports'][number] = {
      policy: [],
      report: [ DF.quad(DF.namedNode(''), REPORT.terms.activationState, REPORT.terms.Inactive) ],
    };

    const result = await resolver.handleSafe({ reports: [ active, inactive ]});
    expect(source.handle).toHaveBeenCalledTimes(1);
    expect(source.handle).toHaveBeenLastCalledWith({ reports: [ active ]});
    expect(result.identifier).toBe(responseId);
    expect(result.report).toBeRdfIsomorphic([
      ...response,
      DF.quad(responseId, REPORT.terms.algorithm, REPORT.terms.OnlyActiveRules),
    ]);
  });
});
