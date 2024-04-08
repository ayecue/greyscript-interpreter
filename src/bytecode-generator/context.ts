import {
  BytecodeGeneratorContext as GreybelBytecodeGeneratorContext,
  BytecodeGeneratorContextOptions as GreybelBytecodeGeneratorContextOptions
} from 'greybel-interpreter';

export class Context extends GreybelBytecodeGeneratorContext {
  protected _evaluatedImportCodes: Set<string>;

  constructor(options: GreybelBytecodeGeneratorContextOptions) {
    super(options);
    this._evaluatedImportCodes = new Set();
  }

  get evaluatedImportCodes() {
    return this._evaluatedImportCodes;
  }
}
