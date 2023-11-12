import {
  CPSContext,
  CPSVisitCallback,
  defaultCPSVisit as defaultGreybelCPSVisit,
  Noop,
  Operation,
  PrepareError,
  CPS as GreybelCPS
} from 'greybel-interpreter';
import {
  ASTFeatureImportExpression,
  ASTFeatureIncludeExpression,
  ASTType as ASTTypeExtended
} from 'greybel-core';
import { ASTImportCodeExpression, ASTType } from 'greyscript-core';
import { ASTBase, ASTRange } from 'miniscript-core';
import { Include } from './operations/include';
import { Import } from './operations/import';

export const defaultCPSVisit: CPSVisitCallback = async (
  cpsVisit: CPSVisitCallback,
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
        const subVisit = cpsVisit.bind(null, cpsVisit, context, [
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
    case ASTTypeExtended.FeatureImportExpression: {
      const importExpr = item as ASTFeatureImportExpression;
      const target = await context.handler.resourceHandler.getTargetRelativeTo(
        currentTarget,
        importExpr.path
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

        throw new PrepareError(`Cannot find import "${currentTarget}"`, {
          target: currentTarget,
          range
        });
      }

      try {
        const subVisit = cpsVisit.bind(null, cpsVisit, context, [...stack, target]);
        const importStatement = await new Import(
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
    case ASTTypeExtended.FeatureIncludeExpression: {
      const includeExpr = item as ASTFeatureIncludeExpression;
      const target = await context.handler.resourceHandler.getTargetRelativeTo(
        currentTarget,
        includeExpr.path
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

        throw new PrepareError(`Cannot find include "${currentTarget}"`, {
          target: currentTarget,
          range
        });
      }

      try {
        const subVisit = cpsVisit.bind(null, cpsVisit, context, [...stack, target]);
        const importStatement = await new Include(
          includeExpr,
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
      return defaultGreybelCPSVisit(cpsVisit, context, stack, item);
    }
  }
};

export class CPS extends GreybelCPS {
  constructor(context: CPSContext, cpsVisit: CPSVisitCallback = defaultCPSVisit) {
    super(context, cpsVisit);
  }
}