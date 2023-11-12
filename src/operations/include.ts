import {
  CPSVisit,
  Include as GreybelInclude,
  Operation
} from 'greybel-interpreter';
import { Parser } from 'greyscript-core';

export class Include extends GreybelInclude {
  async build(visit: CPSVisit): Promise<Operation> {
    const parser = new Parser(this.code);
    this.chunk = parser.parseChunk();
    this.top = await visit(this.chunk);
    return this;
  }
}
