import { GraphQLFloat } from 'graphql';
import { GraphQLObjectType, GraphQLNonNull, GraphQLString, GraphQLInt, GraphQLID } from 'graphql';
import { IBudget } from '../../../api/types/budget/budgetInterface.js';
import { transactionHelpers } from '../../../api/types/transaction/transactionHelpers.js';
import { getUserByAuthId } from '../../../api/user.js';
import { interestRateInputType } from '../interestRate/type.js';

import Budget from '../../../api/budget.js';
import { budgetsType } from './type.js';
import { transactionType } from '../transaction/type.js';
import { ITransaction } from '../../../api/types/transaction/transactionInterface.js';
export default new GraphQLObjectType({
  name: 'BudgetMutations',
  fields: (): any => ({
    createBudget: {
      type: budgetsType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        description: { type: new GraphQLNonNull(GraphQLString) },
        defaultInterestRate: { type: new GraphQLNonNull(interestRateInputType) },
        initialAmount: { type: new GraphQLNonNull(GraphQLInt) },
        initialTransactionDescription: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<IBudget> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);
        const now = transactionHelpers.validate.entryTimestamp(new Date().getTime());
        args.defaultInterestRate.entryTimestamp = now;

        try {
          const newBudgetInfo: Pick<IBudget, 'name' | 'description' | 'defaultInterestRate'> = {
            name: args.name,
            description: args.description,
            defaultInterestRate: args.defaultInterestRate,
          };
          return await Budget.create(user._id, newBudgetInfo, args.initialAmount, args.initialTransactionDescription);
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err);
        }
      },
    },
    editBudget: {
      type: budgetsType,
      args: {
        budgetId: { type: new GraphQLNonNull(GraphQLID) },
        name: { type: new GraphQLNonNull(GraphQLString) },
        description: { type: new GraphQLNonNull(GraphQLString) },
        defaultInterestRate: { type: new GraphQLNonNull(interestRateInputType) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<IBudget> {
        await context.getCurrentUserAuthIdOrThrowValidationError();
        const now = transactionHelpers.validate.entryTimestamp(new Date().getTime());
        args.defaultInterestRate.entryTimestamp = now;

        try {
          return await Budget.edit({
            budgetId: args.budgetId,
            name: args.name,
            description: args.description,
            defaultInterestRateType: args.defaultInterestRate.type,
            defaultInterestRateDuration: args.defaultInterestRate.duration,
            defaultInterestRateAmount: args.defaultInterestRate.amount,
            defaultInterestRateExpectedPayments: args.defaultInterestRate.expectedPayments,
            defaultInterestRateIsCompounding: args.defaultInterestRate.isCompounding,
          });
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err);
        }
      },
    },
    addFundsToBudget: {
      type: transactionType,
      args: {
        budgetId: { type: new GraphQLNonNull(GraphQLID) },
        description: { type: new GraphQLNonNull(GraphQLString) },
        transactionTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
        amount: { type: new GraphQLNonNull(GraphQLFloat) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ITransaction> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);
        await Budget.getOneFromUser({ userId: user._id, budgetId: args.budgetId });

        try {
          return await Budget.addFundsFromOutside({
            userId: user._id,
            budgetId: args.budgetId,
            transactionTimestamp: args.transactionTimestamp,
            description: args.description,
            amount: args.amount,
          });
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err);
        }
      },
    },
    withdrawFundsFromBudget: {
      type: transactionType,
      args: {
        budgetId: { type: new GraphQLNonNull(GraphQLID) },
        description: { type: new GraphQLNonNull(GraphQLString) },
        transactionTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
        amount: { type: new GraphQLNonNull(GraphQLFloat) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ITransaction> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);
        await Budget.getOneFromUser({ userId: user._id, budgetId: args.budgetId });

        try {
          return await Budget.withdrawFundsToOutside({
            userId: user._id,
            budgetId: args.budgetId,
            transactionTimestamp: args.transactionTimestamp,
            description: args.description,
            amount: args.amount,
          });
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err);
        }
      },
    },
    archiveBudget: {
      type: budgetsType,
      args: {
        budgetId: { type: new GraphQLNonNull(GraphQLID) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<IBudget> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);
        const budget: any = await Budget.getOneFromUser({ userId: user._id, budgetId: args.budgetId });

        try {
          return await Budget.setIsArchived({
            budgetId: budget._id,
            isArchived: true,
          });
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err);
        }
      },
    },
    unarchiveBudget: {
      type: budgetsType,
      args: {
        budgetId: { type: new GraphQLNonNull(GraphQLID) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<IBudget> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);
        const budget: any = await Budget.getOneFromUser({ userId: user._id, budgetId: args.budgetId });

        try {
          return await Budget.setIsArchived({
            budgetId: budget._id,
            isArchived: false,
          });
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err);
        }
      },
    },
  }),
});
