import crypto from 'node:crypto';
import type { Quad } from '@rdfjs/types';
import { DataFactory as DF } from 'n3';
import { CODRL, ODRL, RDF } from '../../src/Vocabularies';

// Numbers are priorities
type PolicyCount = { match?: (number | null)[]; wrong?: (number | null)[] };
export const defaultAction = DF.namedNode(`${ODRL.namespace}read`);
export const defaultTarget = DF.namedNode('http://example.org/target');

export function generatePolicies(options: { prohibition?: PolicyCount; permission?: PolicyCount }): Quad[] {
  const result: Quad[] = [];
  for (const type of [ 'prohibition', 'permission' ] as const) {
    for (const match of [ 'match', 'wrong' ] as const) {
      for (const priority of options[type]?.match ?? []) {
        result.push(...generatePolicy({ type, match: match === 'match', priority }));
      }
    }
  }
  return result;
}

export function generatePolicy(options: {
  type: 'prohibition' | 'permission';
  match: boolean;
  priority: number | null;
}): Quad[] {
  const set = DF.namedNode(`urn:uuid:${crypto.randomUUID()}`);
  const rule = DF.namedNode(`urn:uuid:${crypto.randomUUID()}`);
  const result = [
    DF.quad(set, RDF.terms.type, ODRL.terms.Set),
    DF.quad(set, ODRL.terms[options.type], rule),
    DF.quad(rule, ODRL.terms.action, defaultAction),
    DF.quad(rule, ODRL.terms.target, options.match ? defaultTarget : DF.namedNode('http://example.org/wrong')),
  ];

  if (typeof options.priority === 'number') {
    result.push(
      DF.quad(rule, CODRL.terms.priority, DF.literal(options.priority)),
    );
  }

  return result;
}
