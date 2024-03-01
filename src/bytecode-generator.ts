import {
  BytecodeConverterOptions,
  BytecodeGenerator as GreybelBytecodeGenerator,
  PrepareError
} from 'greybel-interpreter';
import { ASTImportCodeExpression, ASTType, Parser } from 'greyscript-core';
import { ASTBase, ASTRange } from 'miniscript-core';

export class BytecodeGenerator extends GreybelBytecodeGenerator {
  protected evaluatedImportCodes: Set<string>;

  constructor(options: BytecodeConverterOptions) {
    super(options);
    this.evaluatedImportCodes = new Set();
  }

  parse(code: string) {
    try {
      const parser = new Parser(code);
      return parser.parseChunk();
    } catch (err: any) {
      if (err instanceof PrepareError) {
        this.handler.errorHandler.raise(err);
      } else {
        this.handler.errorHandler.raise(
          new PrepareError(err.message, {
            range: err.range,
            target: this.target.peek()
          })
        );
      }
    }
  }

  protected async processNode(node: ASTBase): Promise<void> {
    switch (node.type) {
      case ASTType.ImportCodeExpression:
        await this.processImportCodeExpression(node as ASTImportCodeExpression);
        return;
    }

    return super.processNode(node);
  }

  protected async processImportCodeExpression(node: ASTImportCodeExpression) {
    const currentTarget = this.target.peek();
    const importTarget = await this.handler.resourceHandler.getTargetRelativeTo(
      currentTarget,
      node.directory
    );

    if (this.evaluatedImportCodes.has(importTarget)) {
      return;
    }

    if (this.target.includes(importTarget)) {
      console.warn(
        `Found circular dependency between "${currentTarget}" and "${importTarget}" at line ${node.start.line}. Using noop instead to prevent overflow.`
      );
      return;
    }

    const code = await this.handler.resourceHandler.get(importTarget);

    if (code == null) {
      throw new PrepareError(`Cannot find import "${currentTarget}"`, {
        target: currentTarget,
        range: new ASTRange(node.start, node.end)
      });
    }

    try {
      this.target.push(importTarget);

      const childNodes = this.parse(code);

      await this.processNode(childNodes);
      this.target.pop();
      this.evaluatedImportCodes.add(importTarget);
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
