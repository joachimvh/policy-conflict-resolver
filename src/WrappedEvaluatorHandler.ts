import type { Quad } from '@rdfjs/types';
import type { Evaluator } from './Evaluator';
import type { EvaluatorHandlerArgs } from './EvaluatorHandler';
import { EvaluatorHandler } from './EvaluatorHandler';

/**
 * An {@link EvaluatorHandler} that wraps around an {@link Evaluator}.
 */
export class WrappedEvaluatorHandler extends EvaluatorHandler {
  public constructor(
    protected evaluator: Evaluator,
  ) {
    super();
  }

  public async handle({ policy, request, state }: EvaluatorHandlerArgs): Promise<Quad[]> {
    return this.evaluator.evaluate(policy, request, state);
  }
}
