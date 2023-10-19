import {
  CPSContext,
  CPSVisitCallback,
  defaultCPSVisit,
  Noop,
  Operation,
  PrepareError
} from 'greybel-interpreter';
import { ASTImportCodeExpression, ASTType } from 'greyscript-core';
import { ASTBase, ASTRange } from 'miniscript-core';
import { Include } from './operations/include';

export const cpsVisit: CPSVisitCallback = async (
  internalCPSVisit: CPSVisitCallback,
  context: CPSContext,
  stack: string[],
  item: ASTBase
): Promise<Operation> => {
  const currentTarget = stack[stack.length - 1];

  switch (item.type) {
    case ASTType.ImportCodeExpression: {
      const importExpr = item as ASTImportCodeExpression;

      const target = await context.handler.resourceHandler.getTargetRelativeTo(
        currentTarget,
        importExpr.directory
      );

      if (stack.includes(target)) {
        console.warn(
          `Found circular dependency between "${currentTarget}" and "${target}" at line ${item.start.line}. Using noop instead to prevent overflow.`
        );
        return new Noop(item, target);
      }

      const code = await context.handler.resourceHandler.get(target);

      if (code == null) {
        const range = new ASTRange(item.start, item.end);

        throw new PrepareError(`Cannot find native import "${currentTarget}"`, {
          target: currentTarget,
          range
        });
      }

      try {
        const subVisit = internalCPSVisit.bind(null, internalCPSVisit, context, [
          ...stack,
          target
        ]);
        const importStatement = await new Include(
          importExpr,
          currentTarget,
          target,
          code
        ).build(subVisit);

        return importStatement;
      } catch (err: any) {
        if (err instanceof PrepareError) {
          throw err;
        }

        throw new PrepareError(
          err.message,
          {
            target,
            range: new ASTRange(item.start, item.end)
          },
          err
        );
      }
    }
    default: {
      return defaultCPSVisit(internalCPSVisit, context, stack, item);
    }
  }
};
