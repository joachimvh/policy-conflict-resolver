import 'jest-rdf';
import { DataFactory as DF, Store } from 'n3';
import { getTripleChain } from '../../src/Util';
import { RDF, REPORT } from '../../src/Vocabularies';

describe('Util', (): void => {
  describe('#getTripleChain', (): void => {
    it('returns all triples starting from the given subject and can handle cycles.', async(): Promise<void> => {
      const subject1 = DF.namedNode('urn:1');
      const report = DF.namedNode('urn:report');
      const subject2 = DF.namedNode('urn:2');
      const data = new Store([
        DF.quad(subject1, RDF.terms.type, REPORT.terms.ConflictReport),
        DF.quad(subject1, REPORT.terms.reason, report),
        DF.quad(report, RDF.terms.type, REPORT.terms.PermissionReport),
        DF.quad(report, REPORT.terms.ruleReport, subject1),
        DF.quad(subject2, RDF.terms.type, REPORT.terms.ConflictReport),
      ]);

      expect(getTripleChain(subject1, data)).toBeRdfIsomorphic([
        DF.quad(subject1, RDF.terms.type, REPORT.terms.ConflictReport),
        DF.quad(subject1, REPORT.terms.reason, report),
        DF.quad(report, RDF.terms.type, REPORT.terms.PermissionReport),
        DF.quad(report, REPORT.terms.ruleReport, subject1),
      ]);
    });
  });
});
