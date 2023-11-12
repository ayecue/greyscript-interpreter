import { CPSContext, Interpreter as GreybelInterpreter } from 'greybel-interpreter';
import { CPS } from './cps';
import { Parser } from 'greyscript-core';

export class Interpreter extends GreybelInterpreter {
  createCPS() {
    const cpsCtx = new CPSContext(this.target, this.handler);
    return new CPS(cpsCtx);
  }

  parse(code: string) {
    const parser = new Parser(code);
    return parser.parseChunk();
  }
}
