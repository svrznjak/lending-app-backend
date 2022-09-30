import { ITransaction } from './../../../api/types/transaction/transactionInterface.js';
import { transactionType } from './../transaction/type.js';
import { GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType } from 'graphql';
import { getUserByAuthId } from '../../../api/user.js';
import loan from '../../../api/loan.js';
import { paginationType } from '../commonTypes.js';
import LoanModel from '../../../api/db/model/LoanModel.js';

export default new GraphQLObjectType({
  name: 'LoanQueries',
  fields: (): any => ({
    transactions: {
      type: new GraphQLList(transactionType),
      args: {
        loanId: { type: new GraphQLNonNull(GraphQLID) },
        pagination: { type: paginationType },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ITransaction[]> {
        const authId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const Mongo_user = await getUserByAuthId(authId);
        const Mongo_loan = await LoanModel.findOne({ _id: args.loanId });
        if (Mongo_loan === null) throw new Error('Loan does not exist!');
        if (Mongo_loan.userId.toString !== Mongo_user._id.toString()) throw new Error('Unauthorized');

        return await loan.getTransactions(args.loanId, {
          pageSize: args.pagination.pageSize,
          pageNumber: args.pagination.pageNumber,
        });
      },
    },
  }),
});
