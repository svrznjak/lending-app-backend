import { ITransaction } from './../../../api/types/transaction/transactionInterface.js';
import { GraphQLFloat, GraphQLID, GraphQLList } from 'graphql';
import { GraphQLObjectType, GraphQLNonNull, GraphQLString } from 'graphql';
import { ILoan } from '../../../api/types/loan/loanInterface.js';
import { getUserByAuthId } from '../../../api/user.js';
import { interestRateInputType } from '../interestRate/type.js';

import Loan from '../../../api/loan.js';
import { loanType, fundInputType } from './type.js';
import { transactionType } from '../transaction/type.js';
import LoanModel from '../../../api/db/model/LoanModel.js';
import BudgetModel from '../../../api/db/model/BudgetModel.js';
export default new GraphQLObjectType({
  name: 'LoanMutations',
  fields: (): any => ({
    createLoan: {
      type: loanType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        description: { type: new GraphQLNonNull(GraphQLString) },
        openedTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
        closesTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
        interestRate: { type: new GraphQLNonNull(interestRateInputType) },
        initialTransactionDescription: { type: new GraphQLNonNull(GraphQLString) },
        funds: { type: new GraphQLList(fundInputType) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ILoan> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);

        try {
          const newLoanInfo: Pick<
            ILoan,
            'name' | 'description' | 'openedTimestamp' | 'closesTimestamp' | 'interestRate'
          > = {
            name: args.name,
            description: args.description,
            openedTimestamp: args.openedTimestamp,
            closesTimestamp: args.closesTimestamp,
            interestRate: args.interestRate,
          };
          newLoanInfo.interestRate.entryTimestamp = new Date().getTime();
          return await Loan.create(user._id.toString(), newLoanInfo, args.funds, args.initialTransactionDescription);
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err);
        }
      },
    },
    addPayment: {
      type: transactionType,
      args: {
        loanId: { type: new GraphQLNonNull(GraphQLID) },
        budgetId: { type: new GraphQLNonNull(GraphQLID) },
        description: { type: new GraphQLNonNull(GraphQLString) },
        transactionTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
        amount: { type: new GraphQLNonNull(GraphQLFloat) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ITransaction> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const Mongo_user = await getUserByAuthId(userAuthId);
        const Mongo_budget: any = await BudgetModel.findById(args.budgetId);
        if (Mongo_budget === null) throw new Error('Budget does not exist!');
        if (Mongo_budget.userId.toString() !== Mongo_user._id.toString()) throw new Error('Unauthorized');
        const Mongo_loan: any = await LoanModel.findById(args.loanId);
        if (Mongo_loan === null) throw new Error('Loan does not exist!');
        if (Mongo_loan.userId.toString() !== Mongo_user._id.toString()) throw new Error('Unauthorized');

        try {
          const newTransaction = await Loan.addPayment({
            userId: Mongo_user._id.toString(),
            loanId: args.loanId,
            budgetId: args.budgetId,
            transactionTimestamp: args.transactionTimestamp,
            description: args.description,
            amount: args.amount,
          });
          return newTransaction;
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err);
        }
      },
    },
    addManualInterest: {
      type: transactionType,
      args: {
        loanId: { type: new GraphQLNonNull(GraphQLID) },
        description: { type: new GraphQLNonNull(GraphQLString) },
        transactionTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
        amount: { type: new GraphQLNonNull(GraphQLFloat) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ITransaction> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);

        // get loan to check if loan with loanId exists for specified user userId
        await Loan.getOneFromUser({ userId: user._id, loanId: args.loanId });

        try {
          const newTransaction = await Loan.addManualInterest({
            userId: user._id,
            loanId: args.loanId,
            transactionTimestamp: args.transactionTimestamp,
            description: args.description,
            amount: args.amount,
          });
          return newTransaction;
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err);
        }
      },
    },
    pause: {
      type: loanType,
      args: {
        loanId: { type: new GraphQLNonNull(GraphQLID) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ILoan> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);

        // get loan to check if loan with loanId exists for specified user userId
        await Loan.getOneFromUser({ userId: user._id, loanId: args.loanId });

        try {
          return await Loan.pause(args.loanId);
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err);
        }
      },
    },
    unpause: {
      type: loanType,
      args: {
        loanId: { type: new GraphQLNonNull(GraphQLID) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ILoan> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);

        // get loan to check if loan with loanId exists for specified user userId
        await Loan.getOneFromUser({ userId: user._id, loanId: args.loanId });

        try {
          return await Loan.unpause(args.loanId);
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err);
        }
      },
    },
  }),
});
