import crypto from 'node:crypto';
import type { Quad } from '@rdfjs/types';
import { DataFactory as DF } from 'n3';
import { ODRL, RDF } from '../../src/Vocabularies';

type PolicyCount = { match?: number; wrong?: number };
export const defaultAction = DF.namedNode(`${ODRL.namespace}read`);
export const defaultTarget = DF.namedNode('http://example.org/target');

export function generatePolicies(options: { prohibition?: PolicyCount; permission?: PolicyCount }): Quad[] {
  const result: Quad[] = [];
  for (const type of [ 'prohibition', 'permission' ] as const) {
    for (const match of [ 'match', 'wrong' ] as const) {
      for (let i = 0; i < (options[type]?.[match] ?? 0); ++i) {
        result.push(...generatePolicy({ type, match: match === 'match' }));
      }
    }
  }
  return result;
}

export function generatePolicy(options: { type: 'prohibition' | 'permission'; match: boolean }): Quad[] {
  const set = DF.namedNode(`urn:uuid:${crypto.randomUUID()}`);
  const rule = DF.namedNode(`urn:uuid:${crypto.randomUUID()}`);
  return [
    DF.quad(set, RDF.terms.type, ODRL.terms.Set),
    DF.quad(set, ODRL.terms[options.type], rule),
    DF.quad(rule, ODRL.terms.action, defaultAction),
    DF.quad(rule, ODRL.terms.target, options.match ? defaultTarget : DF.namedNode('http://example.org/wrong')),
  ];
}
