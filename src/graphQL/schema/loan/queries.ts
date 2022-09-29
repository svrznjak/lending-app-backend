import { ITransaction } from './../../../api/types/transaction/transactionInterface.js';
import { transactionType } from './../transaction/type.js';
import { GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType } from 'graphql';
import { getUserByAuthId } from '../../../api/user.js';
import loan from '../../../api/loan.js';

export default new GraphQLObjectType({
  name: 'LoanQueries',
  fields: (): any => ({
    transactions: {
      type: new GraphQLList(transactionType),
      args: {
        loanId: { type: new GraphQLNonNull(GraphQLID) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ITransaction[]> {
        const authId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(authId);
        if (user.loans.find((loan) => (loan._id === args.loanId) == undefined))
          throw new Error('Unauthorized/budget-does-not-exist');

        return await loan.getTransactions(args.loanId);
      },
    },
  }),
});
