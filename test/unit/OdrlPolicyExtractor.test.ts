import { DataFactory as DF, Store } from 'n3';
import { OdrlPolicyExtractor } from '../../src/OdrlPolicyExtractor';
import { ODRL, RDF } from '../../src/Vocabularies';

describe('OdrlPolicyExtractor', (): void => {
  const action1 = DF.namedNode(`${ODRL.namespace}read`);
  const action2 = DF.namedNode(`${ODRL.namespace}write`);
  const target1 = DF.namedNode('http://example.org/target1');
  const target2 = DF.namedNode('http://example.org/target2');
  const set1 = DF.namedNode(`urn:set1`);
  const set2 = DF.namedNode(`urn:set2`);
  const rule1 = DF.namedNode(`urn:rule1`);
  const rule2 = DF.namedNode(`urn:rule2`);
  const rule3 = DF.namedNode(`urn:rule3`);

  const extractor = new OdrlPolicyExtractor();
  it('extracts all individual policies.', async(): Promise<void> => {
    const policyData = [
      DF.quad(set1, RDF.terms.type, ODRL.terms.Set),

      DF.quad(set1, ODRL.terms.prohibition, rule1),
      DF.quad(rule1, ODRL.terms.action, action1),
      DF.quad(rule1, ODRL.terms.target, target1),

      DF.quad(set1, ODRL.terms.prohibition, rule2),
      DF.quad(rule2, ODRL.terms.action, action2),
      DF.quad(rule2, ODRL.terms.target, target1),

      DF.quad(set2, RDF.terms.type, ODRL.terms.Set),

      DF.quad(set2, ODRL.terms.permission, rule3),
      DF.quad(rule3, ODRL.terms.action, action1),
      DF.quad(rule3, ODRL.terms.target, target2),
    ];

    const result = await extractor.extract(policyData);
    expect(result).toHaveLength(3);
    const store1 = new Store(result[0]);
    expect(store1.countQuads(set1, ODRL.terms.prohibition, null, null)).toBe(1);
    expect(store1.countQuads(set1, ODRL.terms.prohibition, rule1, null)).toBe(1);
    expect(store1.countQuads(rule1, ODRL.terms.action, action1, null)).toBe(1);
    expect(store1.countQuads(rule1, ODRL.terms.target, target1, null)).toBe(1);

    const store2 = new Store(result[1]);
    expect(store2.countQuads(set1, ODRL.terms.prohibition, null, null)).toBe(1);
    expect(store2.countQuads(set1, ODRL.terms.prohibition, rule2, null)).toBe(1);

    const store3 = new Store(result[2]);
    expect(store3.countQuads(set2, ODRL.terms.permission, null, null)).toBe(1);
    expect(store3.countQuads(set2, ODRL.terms.permission, rule3, null)).toBe(1);
  });

  it('splits up rules with multiple actions and targets.', async(): Promise<void> => {
    const policyData = [
      DF.quad(set1, RDF.terms.type, ODRL.terms.Set),
      DF.quad(set1, ODRL.terms.prohibition, rule1),
      DF.quad(rule1, ODRL.terms.action, action1),
      DF.quad(rule1, ODRL.terms.action, action2),
      DF.quad(rule1, ODRL.terms.target, target1),
      DF.quad(rule1, ODRL.terms.target, target2),
    ];

    const result = await extractor.extract(policyData);
    expect(result).toHaveLength(4);

    const store1 = new Store(result[0]);
    expect(store1.countQuads(set1, ODRL.terms.prohibition, null, null)).toBe(1);
    expect(store1.countQuads(set1, ODRL.terms.prohibition, rule1, null)).toBe(1);
    expect(store1.countQuads(rule1, ODRL.terms.action, action1, null)).toBe(1);
    expect(store1.countQuads(rule1, ODRL.terms.target, target1, null)).toBe(1);

    const store2 = new Store(result[1]);
    expect(store2.countQuads(set1, ODRL.terms.prohibition, null, null)).toBe(1);
    expect(store2.countQuads(set1, ODRL.terms.prohibition, rule1, null)).toBe(1);
    expect(store2.countQuads(rule1, ODRL.terms.action, action1, null)).toBe(1);
    expect(store2.countQuads(rule1, ODRL.terms.target, target2, null)).toBe(1);
  });
});
