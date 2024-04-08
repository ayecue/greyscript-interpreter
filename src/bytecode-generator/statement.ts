import {
  BytecodeStatementGenerator as GreybelBytecodeStatementGenerator,
  PrepareError
} from 'greybel-interpreter';
import { ASTImportCodeExpression } from 'greyscript-core';
import { ASTBase, ASTRange, ASTType } from 'miniscript-core';

import { Context } from './context';

export class BytecodeStatementGenerator extends GreybelBytecodeStatementGenerator {
  protected context: Context;

  async process(node: ASTBase): Promise<void> {
    switch (node.type) {
      case ASTType.ImportCodeExpression:
        await this.processImportCodeExpression(node as ASTImportCodeExpression);
        return;
    }

    return super.process(node);
  }

  protected async processImportCodeExpression(node: ASTImportCodeExpression) {
    const currentTarget = this.context.target.peek();
    const importTarget =
      await this.context.handler.resourceHandler.getTargetRelativeTo(
        currentTarget,
        node.directory
      );

    if (this.context.evaluatedImportCodes.has(importTarget)) {
      return;
    }

    if (this.context.target.includes(importTarget)) {
      console.warn(
        `Found circular dependency between "${currentTarget}" and "${importTarget}" at line ${node.start.line}. Using noop instead to prevent overflow.`
      );
      return;
    }

    const code = await this.context.handler.resourceHandler.get(importTarget);

    if (code == null) {
      throw new PrepareError(`Cannot find import "${currentTarget}"`, {
        target: currentTarget,
        range: new ASTRange(node.start, node.end)
      });
    }

    try {
      this.context.target.push(importTarget);

      const childNodes = this.parseCode(code);

      await this.process(childNodes);
      this.context.target.pop();
      this.context.evaluatedImportCodes.add(importTarget);
    } catch (err: any) {
      if (err instanceof PrepareError) {
        throw err;
      }

      throw new PrepareError(
        err.message,
        {
          target: importTarget,
          range: new ASTRange(node.start, node.end)
        },
        err
      );
    }
  }
}
