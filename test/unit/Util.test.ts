import 'jest-rdf';
import { DataFactory as DF, Store } from 'n3';
import { getTripleChain } from '../../src/Util';
import { FORCE, RDF } from '../../src/Vocabularies';

describe('Util', (): void => {
  describe('#getTripleChain', (): void => {
    it('returns all triples starting from the given subject and can handle cycles.', async(): Promise<void> => {
      const subject1 = DF.namedNode('urn:1');
      const report = DF.namedNode('urn:report');
      const subject2 = DF.namedNode('urn:2');
      const data = new Store([
        DF.quad(subject1, RDF.terms.type, FORCE.terms.ConflictReport),
        DF.quad(subject1, FORCE.terms.reason, report),
        DF.quad(report, RDF.terms.type, FORCE.terms.PermissionReport),
        DF.quad(report, FORCE.terms.ruleReport, subject1),
        DF.quad(subject2, RDF.terms.type, FORCE.terms.ConflictReport),
      ]);

      expect(getTripleChain(subject1, data)).toBeRdfIsomorphic([
        DF.quad(subject1, RDF.terms.type, FORCE.terms.ConflictReport),
        DF.quad(subject1, FORCE.terms.reason, report),
        DF.quad(report, RDF.terms.type, FORCE.terms.PermissionReport),
        DF.quad(report, FORCE.terms.ruleReport, subject1),
      ]);
    });
  });
});
