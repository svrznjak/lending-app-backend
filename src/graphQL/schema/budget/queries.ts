import { paginationInputType } from './../commonTypes.js';
import { ITransaction } from './../../../api/types/transaction/transactionInterface.js';
import { transactionType } from './../transaction/type.js';
import { GraphQLFloat, GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType } from 'graphql';
import { getUserByAuthId } from '../../../api/user.js';
import budget from '../../../api/budget.js';
import BudgetModel from '../../../api/db/model/BudgetModel.js';
import { budgetCalculatedValues, budgetsType } from './type.js';
import { IBudget } from '../../../api/types/budget/budgetInterface.js';

export default new GraphQLObjectType({
  name: 'BudgetQueries',
  fields: (): any => ({
    budget: {
      type: budgetsType,
      args: {
        budgetId: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (_parent: any, args: any, context: any): Promise<IBudget> => {
        const authId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(authId);
        return await budget.getOneFromUser({ userId: user._id, budgetId: args.budgetId });
      },
    },
    budgets: {
      type: new GraphQLList(budgetsType),
      resolve: async (_parent: any, _args: any, context: any): Promise<IBudget[]> => {
        const authId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(authId);

        const budgets = await budget.getAllFromUser({ userId: user._id });
        return budgets;
      },
    },
    transactions: {
      type: new GraphQLList(transactionType),
      args: {
        budgetId: { type: new GraphQLNonNull(GraphQLID) },
        pagination: { type: paginationInputType },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ITransaction[]> {
        const authId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(authId);
        const Mongo_budget: any = await BudgetModel.findOne({ _id: args.budgetId });
        if (Mongo_budget === null) throw new Error('Budget does not exist!');
        if (Mongo_budget.userId.toString() !== user._id) throw new Error('Unauthorized');

        return await budget.getTransactions(args.budgetId, {
          pageSize: args.pagination?.pageSize,
          pageNumber: args.pagination?.pageNumber,
        });
      },
    },
    /*
     * Queries calculated fields at specific time.
     * Query is not totaly protected to speed up response.
     * - Response does not return data about the budget or user it belongs to. Hence data is useless to malicious actor.
     */
    calculatedValuesAtTimestamp: {
      type: new GraphQLList(budgetCalculatedValues),
      args: {
        budgetIds: { type: new GraphQLList(GraphQLID) },
        timestamp: { type: new GraphQLNonNull(GraphQLFloat) },
      },
      async resolve(
        _parent: any,
        args: any,
        context: any,
      ): Promise<
        Pick<
          IBudget,
          '_id' | 'calculatedTotalInvestedAmount' | 'calculatedTotalWithdrawnAmount' | 'calculatedTotalAvailableAmount'
        >[]
      > {
        await context.getCurrentUserAuthIdOrThrowValidationError();
        if (args.budgetIds.length === 0) return [];
        const CALCULATED_VALUES: Pick<
          IBudget,
          '_id' | 'calculatedTotalInvestedAmount' | 'calculatedTotalWithdrawnAmount' | 'calculatedTotalAvailableAmount'
        >[] = await args.budgetIds.map(async (budgetId: string) => {
          return {
            _id: budgetId,
            ...(await budget.getCalculatedValuesAtTimestamp({ budgetId: budgetId, timestampLimit: args.timestamp })),
          };
        });
        return CALCULATED_VALUES;
      },
    },
  }),
});
