# Policy Conflict Resolver

A policy evaluator that focuses on conflict resolution when multiple applicable policies provide conflicting results.
The interface and input/output is based on those of the [ODRL Evaluator](https://github.com/SolidLabResearch/ODRL-Evaluator).

The core class is the `ConflictEvaluator` which has the same interface as the above-mentioned ODRL Evaluator
and is instantiated with 3 parameters:

1. A `PolicyExtractor` which consumes a set of Quads containing one or more policies,
   and for every policy it detects, returns an array of Quads containing only the relevant Quads for that policy.
   This library provides an implementation for default ODRL in the `OdrlPolicyExtractor`.
2. Another `Evaluator`, such as the ODRL Evaluator.
   This `Evaluator` will be called for every Quad array returned by the previous step.
   The `request` and `state` arrays will remain unchanged.
3. A `ConflictResolver` that takes all the reports returned by the previous steps
   and generates a new report by applying a conflict resolution algorithm on those reports.
   This library provides the `DenyConflictResolver` which prioritizes prohibitions over permissions.

The resulting report is expected to contain all the necessary information of why a decision was reached.
For example, using the example classes described above with the data from
the [example run](https://github.com/SolidLabResearch/ODRL-Evaluator/blob/main/demo/test-n3-evaluator.ts)
of the ODRL Evaluator repository,
results in the following report:

```ttl
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix report: <http://example.com/report/temp/>.

<urn:uuid:66b760b3-c9f8-4b5e-9810-900f296e6241> a report:ConflictReport;
    report:algorithm report:PrioritizeDeny;
    report:conclusion report:Allow;
    report:reason <urn:uuid:3af49332-1fd5-42d1-9621-f3a6299ac457>;
    report:policyReport <urn:uuid:e5eba200-8faf-40df-adb0-106e12d2c231>.
<urn:uuid:e5eba200-8faf-40df-adb0-106e12d2c231> a report:PolicyReport;
    <http://purl.org/dc/terms/created> "2024-02-12T11:20:10.999Z"^^<http://www.w3.org/2001/XMLSchema#dateTime>;
    report:policy <urn:uuid:95efe0e8-4fb7-496d-8f3c-4d78c97829bc>;
    report:policyRequest <urn:uuid:1bafee59-006c-46a3-810c-5d176b4be364>;
    report:ruleReport <urn:uuid:3af49332-1fd5-42d1-9621-f3a6299ac457>.
<urn:uuid:3af49332-1fd5-42d1-9621-f3a6299ac457> a report:PermissionReport;
    report:attemptState report:Attempted;
    report:rule <urn:uuid:f5199b0a-d824-45a0-bc08-1caa8d19a001>;
    report:ruleRequest <urn:uuid:186be541-5857-4ce3-9f03-1a274f16bf59>;
    report:activationState report:Active.
```

## Potential issues

The `OdrlPolicyExtractor` splits policies by detecting individual rules.
These are found by looking for the action and target relations of rules,
and potentially making the cross product if these occur multiple times in the same rule.
This has two potential issues:

1. In case a policy uses custom profile relations that could also indicate different rule instances, these will not be detected.
2. If the target and/or action are linked to the policy instead of the rule, the extractor will be unable to handle that.

## Components.js

This library supports Components.js configurations. See the `config` folder for examples.
