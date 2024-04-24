import {
  BytecodeCompileResult,
  BytecodeConverterOptions,
  BytecodeGenerator as GreybelBytecodeGenerator,
  OpCode,
  PrepareError
} from 'greybel-interpreter';
import { Context } from './bytecode-generator/context';
import { Parser } from 'greyscript-core';
import { BytecodeStatementGenerator } from './bytecode-generator/statement';

const parse = function(this: BytecodeGenerator, code: string) {
  try {
    const parser = new Parser(code);
    return parser.parseChunk();
  } catch (err: any) {
    if (err instanceof PrepareError) {
      this.context.handler.errorHandler.raise(err);
    } else {
      this.context.handler.errorHandler.raise(
        new PrepareError(err.message, {
          range: err.range,
          target: this.context.target.peek()
        })
      );
    }
  }
}

export class BytecodeGenerator extends GreybelBytecodeGenerator {
  protected evaluatedImportCodes: Set<string>;

  constructor(options: BytecodeConverterOptions) {
    super({
      context: new Context(options),
      ...options
    });
  }

  async compile(code: string): Promise<BytecodeCompileResult> {
    const statementGenerator = new BytecodeStatementGenerator(this.context, parse.bind(this));
    const node = parse.call(this, code);

    await statementGenerator.process(node);

    const mod = this.context.module.peek();

    this.context.pushCode({
      op: OpCode.HALT
    }, node);

    return {
      code: mod.getCode(),
      imports: this.context.imports
    };
  }
}
