import { paginationType } from './../commonTypes.js';
import { ITransaction } from './../../../api/types/transaction/transactionInterface.js';
import { transactionType } from './../transaction/type.js';
import { GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType } from 'graphql';
import { getUserByAuthId } from '../../../api/user.js';
import budget from '../../../api/budget.js';
import BudgetModel from '../../../api/db/model/BudgetModel.js';

export default new GraphQLObjectType({
  name: 'BudgetQueries',
  fields: (): any => ({
    transactions: {
      type: new GraphQLList(transactionType),
      args: {
        budgetId: { type: new GraphQLNonNull(GraphQLID) },
        pagination: { type: paginationType },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ITransaction[]> {
        const authId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const Mongo_user = await getUserByAuthId(authId);
        const Mongo_budget = await BudgetModel.findOne({ _id: args.budgetId });
        if (Mongo_budget === null) throw new Error('Budget does not exist!');
        if (Mongo_budget.userId.toString !== Mongo_user._id.toString()) throw new Error('Unauthorized');

        return await budget.getTransactions(args.budgetId, {
          pageSize: args.pagination.pageSize,
          pageNumber: args.pagination.pageNumber,
        });
      },
    },
  }),
});
