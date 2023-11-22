import {
  ContextType,
  Interpreter as GreybelInterpreter,
  OperationContext,
  PrepareError,
  RuntimeError,
  VM
} from 'greybel-interpreter';
import { InterpreterRunOptions } from 'greybel-interpreter/dist/interpreter';
import { Parser } from 'greyscript-core';

import { BytecodeGenerator } from './bytecode-generator';

export class Interpreter extends GreybelInterpreter {
  parse(code: string) {
    const parser = new Parser(code);
    return parser.parseChunk();
  }

  async inject(code: string, context?: OperationContext): Promise<Interpreter> {
    const bytecodeGenerator = new BytecodeGenerator({
      target: 'injected',
      handler: this.handler
    });
    const result = await bytecodeGenerator.compile(code);
    const vm = new VM({
      target: this.target,
      debugger: this.debugger,
      handler: this.handler,
      environmentVariables: this.environmentVariables,
      contextTypeIntrinsics: this.vm.contextTypeIntrinsics,
      globals: (context ?? this.globalContext).fork({
        code: result.code,
        type: ContextType.Injected
      }),
      imports: result.imports
    });

    try {
      await vm.exec();
    } catch (err: any) {
      if (err instanceof PrepareError || err instanceof RuntimeError) {
        this.handler.errorHandler.raise(err);
      } else {
        this.handler.errorHandler.raise(new RuntimeError(err.message, vm, err));
      }
    }

    return this;
  }

  async run({ customCode, vmOptions }: InterpreterRunOptions = {}): Promise<Interpreter> {
    const code =
      customCode ?? (await this.handler.resourceHandler.get(this.target));
    const bytecodeConverter = new BytecodeGenerator({
      target: this.target,
      handler: this.handler,
      debugMode: this.debugMode
    });
    const bytecode = await bytecodeConverter.compile(code);

    this.initVM(bytecode, vmOptions);

    await this.start();
    return this;
  }
}
