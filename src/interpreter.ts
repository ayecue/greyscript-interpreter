import {
  ContextState,
  ContextType,
  CPS,
  CPSContext,
  Interpreter as GreybelInterpreter,
  Noop,
  Operation,
  OperationContext,
  PrepareError
} from 'greybel-interpreter';
import { Parser } from 'greyscript-core';

import { cpsVisit } from './cps';

export class Interpreter extends GreybelInterpreter {
  setTarget(target: string): Interpreter {
    if (this.apiContext !== null && this.apiContext.isPending()) {
      throw new Error('You cannot set a target while a process is running.');
    }

    this.target = target;

    const cpsCtx = new CPSContext(target, this.handler);
    this.cps = new CPS(cpsCtx, cpsVisit);

    this.apiContext = new OperationContext({
      target,
      isProtected: true,
      debugger: this.debugger,
      handler: this.handler,
      cps: this.cps,
      environmentVariables: this.environmentVariables
    });

    this.globalContext = this.apiContext.fork({
      type: ContextType.Global,
      state: ContextState.Default
    });

    return this;
  }

  prepare(code: string): Promise<Operation> {
    try {
      const parser = new Parser(code);
      const chunk = parser.parseChunk();
      return this.cps.visit(chunk);
    } catch (err: any) {
      if (err instanceof PrepareError) {
        this.handler.errorHandler.raise(err);
      } else {
        this.handler.errorHandler.raise(
          new PrepareError(err.message, {
            range: err.range,
            target: this.target
          })
        );
      }
    }

    return Promise.resolve(new Noop(null));
  }
}
