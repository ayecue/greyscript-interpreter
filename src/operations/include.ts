import {
  ContextState,
  ContextType,
  CPSVisit,
  CustomValue,
  Operation,
  OperationContext
} from 'greybel-interpreter';
import { Parser } from 'greyscript-core';
import { ASTBase } from 'miniscript-core';

export class Include extends Operation {
  readonly item: ASTBase;
  newTarget: string;
  code: string;
  chunk: ASTBase;
  top: Operation;

  constructor(item: ASTBase, target: string, newTarget: string, code: string) {
    super(null, target);
    this.newTarget = newTarget;
    this.item = item;
    this.code = code;
  }

  async build(visit: CPSVisit): Promise<Operation> {
    const parser = new Parser(this.code);
    this.chunk = parser.parseChunk();
    this.top = await visit(this.chunk);
    return this;
  }

  handle(ctx: OperationContext): Promise<CustomValue> {
    const importCtx = ctx.fork({
      type: ContextType.External,
      state: ContextState.Temporary,
      target: this.newTarget
    });

    return this.top.handle(importCtx);
  }
}
