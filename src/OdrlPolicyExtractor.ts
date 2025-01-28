import type { Quad, Term } from '@rdfjs/types';
import { Store } from 'n3';
import type { PolicyExtractor } from './PolicyExtractor';
import { getTripleChain } from './Util';
import { ODRL } from './Vocabularies';

/**
 * Extracts all individual policy/rule combinations from a collection of ODRL policy quads.
 * This works by finding all odrl:action/odrl:target triple combinations.
 * Because of this, this will not work on policy data where those triples have a policy instead of a rule as subject.
 */
export class OdrlPolicyExtractor implements PolicyExtractor {
  public async extract(policies: Quad[]): Promise<Quad[][]> {
    return this.getPolicies(new Store(policies));
  }

  protected getPolicies(data: Store): Quad[][] {
    const rules = this.getRules(data);
    const policyMap: Record<string, { policy: Term; rules: Quad[][] }> = {};

    // Now we still need to find the policies linked to these rules
    const removeQuads: Quad[] = [];
    for (const { rule, quads } of rules) {
      const linkQuads = data.getQuads(null, null, rule, null);
      for (const quad of linkQuads) {
        const policy = quad.subject;
        if (!policyMap[policy.value]) {
          policyMap[policy.value] = { policy, rules: []};
        }
        // Not removing the quad immediately,
        // since this quad could be used multiple times
        // if the rules are a result of an action/target cross product.
        removeQuads.push(quad);
        policyMap[policy.value].rules.push([ quad, ...quads ]);
      }
    }
    data.removeQuads(removeQuads);

    const result: Quad[][] = [];
    for (const { policy, rules } of Object.values(policyMap)) {
      const policyQuads = getTripleChain(policy, data);
      for (const rule of rules) {
        result.push([
          ...policyQuads,
          ...rule,
        ]);
      }
    }
    return result;
  }

  protected getRules(data: Store): { rule: Term; quads: Quad[] }[] {
    const result: { rule: Term; quads: Quad[] }[] = [];
    for (const rule of data.getSubjects(ODRL.terms.action, null, null)) {
      const parts = this.getAtomicRuleParts(rule, data);
      // At this point the only triples remaining in `data` that have the rule as subject are relevant to every part
      const ruleQuads = getTripleChain(rule, data);
      data.removeQuads(ruleQuads);
      for (const part of parts) {
        result.push({
          rule,
          quads: [ ...ruleQuads, ...part ],
        });
      }
    }
    return result;
  }

  protected getAtomicRuleParts(rule: Term, data: Store): Quad[][] {
    const result: Quad[][] = [];
    const actions = this.filterObjects(data, rule, ODRL.terms.action);
    const targets = this.filterObjects(data, rule, ODRL.terms.target);

    for (const action of actions) {
      data.removeQuads(action);
    }
    for (const target of targets) {
      data.removeQuads(target);
    }
    for (const action of actions) {
      for (const target of targets) {
        result.push([
          ...action,
          ...target,
        ]);
      }
    }
    return result;
  }

  protected filterObjects(data: Store, subject: Term, predicate: Term): Quad[][] {
    const result: Quad[][] = [];
    const rootQuads = data.getQuads(subject, predicate, null, null);
    for (const root of rootQuads) {
      result.push([ root, ...getTripleChain(root.object, data) ]);
    }
    return result;
  }
}
