import type { Quad } from '@rdfjs/types';
import { AsyncHandler } from 'asynchronous-handlers';

export interface EvaluatorHandlerInput {
  policy: Quad[];
  request: Quad[];
  state: Quad[];
}

/**
 * An {@link AsyncHandler} that mimics the {@link Evaluator} interface.
 * This can be useful if you want to combine evaluators using utility handlers.
 */
export abstract class EvaluatorHandler extends AsyncHandler<EvaluatorHandlerInput, Quad[]> {}
