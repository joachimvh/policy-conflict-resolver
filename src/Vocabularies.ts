import { createVocabulary } from 'rdf-vocabulary';

export const CODRL = createVocabulary(
  'urn:example:custom:odrl:',
  'priority',
);

export const ODRL = createVocabulary(
  'http://www.w3.org/ns/odrl/2/',
  'Set',
  'Request',
  'permission',
  'Permission',
  'prohibition',
  'Prohibition',

  'action',
  'target',
);

export const REPORT = createVocabulary(
  'http://example.com/report/temp/',
  'PolicyReport',
  'PermissionReport',
  'ProhibitionReport',
  'ruleReport',

  'activationState',
  'Active',
  'Inactive',

  'ConflictReport',
  'PrioritizeDeny',
  'conclusion',
  'Allow',
  'Deny',
  'algorithm',
  'reason',
  'NoValidRule',
  'HighestPriority',
  'OnlyActiveRules',
  'policyReport',
  'rule',
);

export const RDF = createVocabulary(
  'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  'type',
);
