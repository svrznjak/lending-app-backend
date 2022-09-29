import { ITransaction } from './../../../api/types/transaction/transactionInterface.js';
import { transactionType } from './../transaction/type.js';
import { GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType } from 'graphql';
import { getUserByAuthId } from '../../../api/user.js';
import budget from '../../../api/budget.js';

export default new GraphQLObjectType({
  name: 'BudgetQueries',
  fields: (): any => ({
    transactions: {
      type: new GraphQLList(transactionType),
      args: {
        budgetId: { type: new GraphQLNonNull(GraphQLID) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ITransaction[]> {
        const authId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(authId);
        if (user.budgets.find((budget) => (budget._id === args.budgetId) == undefined))
          throw new Error('Unauthorized/budget-does-not-exist');

        return await budget.getTransactions(args.budgetId);
      },
    },
  }),
});
