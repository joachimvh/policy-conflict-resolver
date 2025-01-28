import type { Quad, Term } from '@rdfjs/types';
import type { Store } from 'n3';

/**
 * Returns all triples that could be found by starting from the given subject in the given dataset,
 * and following the objects recursively.
 *
 * @param subject - Term to start from.
 * @param data - Dataset to look in.
 * @param parsed - Internal caching variable to prevent infinite loops.
 *
 * @returns All triples that could be found when starting from the subject.
 */
export function getTripleChain(subject: Term, data: Store, parsed: Record<string, boolean> = {}): Quad[] {
  if (parsed[subject.value]) {
    return [];
  }
  parsed[subject.value] = true;

  const quads = data.getQuads(subject, null, null, null);
  const objects = quads.map((quad): Term => quad.object);
  const uniqueObjects: Term[] = objects.filter((obj, idx): boolean => objects.indexOf(obj) === idx);
  const recursiveResults = uniqueObjects.map((obj): Quad[] => getTripleChain(obj, data, parsed));
  return [ ...quads, ...recursiveResults.flat() ];
}
