import { ITransaction } from './../../../api/types/transaction/transactionInterface.js';
import { transactionType } from './../transaction/type.js';
import { GraphQLFloat, GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import { getUserByAuthId } from '../../../api/user.js';
import Loan from '../../../api/loan.js';
import { paginationInputType } from '../commonTypes.js';
import LoanModel from '../../../api/db/model/LoanModel.js';
import { loanCalculatedValues, loanType } from './type.js';
import { ILoan } from '../../../api/types/loan/loanInterface.js';

export default new GraphQLObjectType({
  name: 'LoanQueries',
  fields: (): any => ({
    loans: {
      type: new GraphQLList(loanType),
      args: {
        loanId: { type: GraphQLID },
        status: {
          type: new GraphQLList(GraphQLString),
        },
      },
      resolve: async (_parent: any, args: any, context: any): Promise<ILoan[]> => {
        const authId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(authId);
        return await Loan.getFromUser({
          userId: user._id,
          loanId: args.loanId,
          status: args.status,
        });
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

        return await Loan.getTransactions(args.loanId, {
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
          | 'calculatedOutstandingInterest'
          | 'calculatedPaidInterest'
          | 'calculatedLastTransactionTimestamp'
          | 'calculatedRelatedBudgets'
        >
      > {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();

        //check if user has access to loan
        const user = await getUserByAuthId(userAuthId);
        await Loan.getOneFromUser({ userId: user._id, loanId: args.loanId });

        return await Loan.getCalculatedValuesAtTimestamp({
          loanId: args.loanId,
          timestampLimit: args.timestamp,
        });
      },
    },
  }),
});
