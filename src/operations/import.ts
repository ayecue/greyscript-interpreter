import {
  CPSVisit,
  Import as GreybelImport,
  Operation
} from 'greybel-interpreter';
import { Parser } from 'greyscript-core';

export class Import extends GreybelImport {
  async build(visit: CPSVisit): Promise<Operation> {
    const parser = new Parser(this.code);
    this.chunk = parser.parseChunk();
    this.top = await visit(this.chunk);
    return this;
  }
}
