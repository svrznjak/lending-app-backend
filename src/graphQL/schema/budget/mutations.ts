import { GraphQLFloat } from 'graphql';
import { GraphQLObjectType, GraphQLNonNull, GraphQLString, GraphQLInt, GraphQLID } from 'graphql';
import { IBudget } from '../../../api/types/budget/budgetInterface.js';
import { transactionHelpers } from '../../../api/types/transaction/transactionHelpers.js';
import { getUserByAuthId } from '../../../api/user.js';
import { interestRateInputType } from '../interestRate/type.js';

import Budget from '../../../api/budget.js';
import { budgetsType } from './type.js';
import BudgetModel from '../../../api/db/model/BudgetModel.js';
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
        const Mongo_user = await getUserByAuthId(userAuthId);
        const now = transactionHelpers.validate.entryTimestamp(new Date().getTime());
        args.defaultInterestRate.entryTimestamp = now;

        const session = await global.mongooseConnection.startSession();
        try {
          session.startTransaction();
          const newBudgetInfo: Pick<IBudget, 'name' | 'description' | 'defaultInterestRate'> = {
            name: args.name,
            description: args.description,
            defaultInterestRate: args.defaultInterestRate,
          };
          const newBudget = await Budget.create(Mongo_user._id.toString(), newBudgetInfo, { session });
          if (args.initialAmount !== 0)
            await Budget.addFundsFromOutside(
              {
                userId: Mongo_user._id.toString(),
                budgetId: newBudget._id.toString(),
                transactionTimestamp: now,
                description: args.initialTransactionDescription,
                amount: args.initialAmount,
              },
              { session },
            );

          await session.commitTransaction();
          return Budget.recalculateCalculatedValues({
            budgetId: newBudget._id.toString(),
          });
        } catch (err: any) {
          await session.abortTransaction();
          console.log(err.message);
          throw new Error(err);
        } finally {
          await session.endSession();
        }
      },
    },
    addFundsToBudget: {
      type: budgetsType,
      args: {
        budgetId: { type: new GraphQLNonNull(GraphQLID) },
        description: { type: new GraphQLNonNull(GraphQLString) },
        transactionTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
        amount: { type: new GraphQLNonNull(GraphQLFloat) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<IBudget> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const Mongo_user = await getUserByAuthId(userAuthId);
        const Mongo_budget = await BudgetModel.findById(args.budgetId);
        if (Mongo_budget === null) throw new Error('Budget does not exist!');
        if (Mongo_budget.userId.toString !== Mongo_user._id.toString()) throw new Error('Unauthorized');

        try {
          await Budget.addFundsFromOutside({
            userId: Mongo_user._id.toString(),
            budgetId: args.budgetId,
            transactionTimestamp: args.transactionTimestamp,
            description: args.description,
            amount: args.amount,
          });
          return Budget.recalculateCalculatedValues({
            budgetId: args.budgetId,
          });
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err);
        }
      },
    },
    withdrawFundsFromBudget: {
      type: budgetsType,
      args: {
        budgetId: { type: new GraphQLNonNull(GraphQLID) },
        description: { type: new GraphQLNonNull(GraphQLString) },
        transactionTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
        amount: { type: new GraphQLNonNull(GraphQLFloat) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<IBudget> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const Mongo_user = await getUserByAuthId(userAuthId);
        const Mongo_budget = await BudgetModel.findById(args.budgetId);
        if (Mongo_budget === null) throw new Error('Budget does not exist!');
        if (Mongo_budget.userId.toString !== Mongo_user._id.toString()) throw new Error('Unauthorized');
        try {
          await Budget.withdrawFundsToOutside({
            userId: Mongo_user._id.toString(),
            budgetId: args.budgetId,
            transactionTimestamp: args.transactionTimestamp,
            description: args.description,
            amount: args.amount,
          });
          return Budget.recalculateCalculatedValues({
            budgetId: args.budgetId,
          });
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err);
        }
      },
    },
  }),
});
