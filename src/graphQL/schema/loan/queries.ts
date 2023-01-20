import { ITransaction } from './../../../api/types/transaction/transactionInterface.js';
import { transactionType } from './../transaction/type.js';
import { GraphQLFloat, GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType } from 'graphql';
import { getUserByAuthId } from '../../../api/user.js';
import loan from '../../../api/loan.js';
import { paginationInputType } from '../commonTypes.js';
import LoanModel from '../../../api/db/model/LoanModel.js';
import { loanCalculatedValues, loanType } from './type.js';
import { ILoan } from '../../../api/types/loan/loanInterface.js';
import { interestRateInputType } from '../interestRate/type.js';

export default new GraphQLObjectType({
  name: 'LoanQueries',
  fields: (): any => ({
    loans: {
      type: new GraphQLList(loanType),
      resolve: async (_parent: any, _args: any, context: any): Promise<ILoan[]> => {
        const authId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(authId);
        return await loan.getAllFromUser({ userId: user._id });
      },
    },
    transactions: {
      type: new GraphQLList(transactionType),
      args: {
        loanId: { type: new GraphQLNonNull(GraphQLID) },
        pagination: { type: paginationInputType },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ITransaction[]> {
        const authId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const Mongo_user = await getUserByAuthId(authId);
        const Mongo_loan: any = await LoanModel.findOne({ _id: args.loanId });
        if (Mongo_loan === null) throw new Error('Loan does not exist!');
        if (Mongo_loan.userId.toString() !== Mongo_user._id.toString()) throw new Error('Unauthorized');

        return await loan.getTransactions(args.loanId, {
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
    loanCalculatedValuesAtTimestamp: {
      type: loanCalculatedValues,
      args: {
        loanId: { type: new GraphQLNonNull(GraphQLID) },
        interestRate: { type: new GraphQLNonNull(interestRateInputType) },
        timestamp: { type: new GraphQLNonNull(GraphQLFloat) },
      },
      async resolve(
        _parent: any,
        args: any,
        context: any,
      ): Promise<
        Pick<
          ILoan,
          | 'calculatedTotalPaidPrincipal'
          | 'calculatedChargedInterest'
          | 'calculatedPaidInterest'
          | 'calculatedLastTransactionTimestamp'
          | 'calculatedRelatedBudgets'
        >
      > {
        await context.getCurrentUserAuthIdOrThrowValidationError();
        return await loan.getCalculatedValuesAtTimestamp({
          loanId: args.loanId,
          interestRate: args.interestRate,
          timestampLimit: args.timestamp,
        });
      },
    },
  }),
});
