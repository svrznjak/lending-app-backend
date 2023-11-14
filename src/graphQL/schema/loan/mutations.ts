import { ITransaction } from './../../../api/types/transaction/transactionInterface.js';
import { GraphQLFloat, GraphQLID, GraphQLList } from 'graphql';
import { GraphQLObjectType, GraphQLNonNull, GraphQLString } from 'graphql';
import { ILoan } from '../../../api/types/loan/loanInterface.js';
import { getUserByAuthId } from '../../../api/user.js';
import { interestRateInputType } from '../interestRate/type.js';

import Loan from '../../../api/loan.js';
import { loanType, fundInputType, loanExpectedPaymentInput } from './type.js';
import { paymentFrequencyInputType } from '../paymentFrequency/type.js';
import { transactionType } from '../transaction/type.js';
import LoanModel from '../../../api/db/model/LoanModel.js';

import Budget from '../../../api/budget.js';
export default new GraphQLObjectType({
  name: 'LoanMutations',
  fields: (): any => ({
    createLoan: {
      type: loanType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        description: { type: GraphQLString },
        openedTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
        closesTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
        interestRate: { type: new GraphQLNonNull(interestRateInputType) },
        paymentFrequency: { type: new GraphQLNonNull(paymentFrequencyInputType) },
        expectedPayments: { type: new GraphQLList(loanExpectedPaymentInput) },
        initialTransactionDescription: { type: new GraphQLNonNull(GraphQLString) },
        funds: { type: new GraphQLList(fundInputType) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ILoan> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);

        try {
          const newLoanInfo: Pick<
            ILoan,
            | 'name'
            | 'description'
            | 'openedTimestamp'
            | 'closesTimestamp'
            | 'interestRate'
            | 'paymentFrequency'
            | 'expectedPayments'
          > = {
            name: args.name,
            description: args.description,
            openedTimestamp: args.openedTimestamp,
            closesTimestamp: args.closesTimestamp,
            interestRate: args.interestRate,
            paymentFrequency: args.paymentFrequency,
            expectedPayments: args.expectedPayments,
          };
          newLoanInfo.interestRate.entryTimestamp = new Date().getTime();
          return await Loan.create(user._id.toString(), newLoanInfo, args.funds, args.initialTransactionDescription);
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
    editLoan: {
      type: loanType,
      args: {
        loanId: { type: new GraphQLNonNull(GraphQLID) },
        name: { type: GraphQLString },
        description: { type: GraphQLString },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ILoan> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);

        // get loan to check if loan with loanId exists for specified user userId
        await Loan.getOneFromUser({ userId: user._id, loanId: args.loanId });

        try {
          const updatedLoan = await Loan.edit({
            userId: user._id,
            loanId: args.loanId,
            name: args.name,
            description: args.description,
          });
          return updatedLoan;
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
    updatePaymentSchedule: {
      type: loanType,
      args: {
        loanId: { type: new GraphQLNonNull(GraphQLID) },
        closesTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
        paymentFrequency: { type: new GraphQLNonNull(paymentFrequencyInputType) },
        expectedPayments: { type: new GraphQLList(loanExpectedPaymentInput) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ILoan> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);

        // get loan to check if loan with loanId exists for specified user userId
        await Loan.getOneFromUser({ userId: user._id, loanId: args.loanId });

        try {
          return await Loan.updatePaymentSchedule({
            userId: user._id,
            loanId: args.loanId,
            closesTimestamp: args.closesTimestamp,
            paymentFrequency: args.paymentFrequency,
            expectedPayments: args.expectedPayments,
          });
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
    addPayment: {
      type: transactionType,
      args: {
        loanId: { type: new GraphQLNonNull(GraphQLID) },
        description: { type: new GraphQLNonNull(GraphQLString) },
        transactionTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
        amount: { type: new GraphQLNonNull(GraphQLFloat) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ITransaction> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const Mongo_user = await getUserByAuthId(userAuthId);
        const Mongo_loan: any = await LoanModel.findById(args.loanId);
        if (Mongo_loan === null) throw new Error('Loan does not exist!');
        if (Mongo_loan.userId.toString() !== Mongo_user._id.toString()) throw new Error('Unauthorized');

        try {
          const newTransaction = await Loan.addPayment({
            userId: Mongo_user._id.toString(),
            loanId: args.loanId,
            transactionTimestamp: args.transactionTimestamp,
            description: args.description,
            amount: args.amount,
          });
          return newTransaction;
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
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
          throw new Error(err.message);
        }
      },
    },
    addFunds: {
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
        const user = await getUserByAuthId(userAuthId);

        // get loan to check if loan with loanId exists for specified user userId
        await Loan.getOneFromUser({ userId: user._id, loanId: args.loanId });
        // get budget to check if budget with budgetId exists for specified user userId
        await Budget.getOneFromUser({ userId: user._id, budgetId: args.budgetId });

        try {
          const newTransaction = await Loan.addFunds({
            userId: user._id,
            budgetId: args.budgetId,
            loanId: args.loanId,
            transactionTimestamp: args.transactionTimestamp,
            description: args.description,
            amount: args.amount,
          });
          return newTransaction;
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
    addForgiveness: {
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
          const newTransaction = await Loan.addForgiveness({
            userId: user._id,
            loanId: args.loanId,
            transactionTimestamp: args.transactionTimestamp,
            description: args.description,
            amount: args.amount,
          });
          return newTransaction;
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
    addRefund: {
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
          const newTransaction = await Loan.addRefund({
            userId: user._id,
            loanId: args.loanId,
            transactionTimestamp: args.transactionTimestamp,
            description: args.description,
            amount: args.amount,
          });
          return newTransaction;
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
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
          const returnval = await Loan.pause(args.loanId);

          return returnval;
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
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
          throw new Error(err.message);
        }
      },
    },
    complete: {
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
          return await Loan.complete(args.loanId);
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
    default: {
      type: loanType,
      args: {
        loanId: { type: new GraphQLNonNull(GraphQLID) },
        defaultTransactionDescription: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ILoan> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);

        // get loan to check if loan with loanId exists for specified user userId
        await Loan.getOneFromUser({ userId: user._id, loanId: args.loanId });

        try {
          return await Loan.default(args.loanId, args.defaultTransactionDescription);
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
    addNote: {
      type: loanType,
      args: {
        loanId: { type: new GraphQLNonNull(GraphQLID) },
        content: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ILoan> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);

        // get loan to check if loan with loanId exists for specified user userId
        await Loan.getOneFromUser({ userId: user._id, loanId: args.loanId });

        try {
          return await Loan.addNote({ loanId: args.loanId, content: args.content });
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
    editNote: {
      type: loanType,
      args: {
        loanId: { type: new GraphQLNonNull(GraphQLID) },
        noteId: { type: new GraphQLNonNull(GraphQLID) },
        content: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ILoan> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);

        // get loan to check if loan with loanId exists for specified user userId
        await Loan.getOneFromUser({ userId: user._id, loanId: args.loanId });

        try {
          return await Loan.editNote({ loanId: args.loanId, noteId: args.noteId, content: args.content });
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
    deleteNote: {
      type: loanType,
      args: {
        loanId: { type: new GraphQLNonNull(GraphQLID) },
        noteId: { type: new GraphQLNonNull(GraphQLID) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ILoan> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);

        // get loan to check if loan with loanId exists for specified user userId
        await Loan.getOneFromUser({ userId: user._id, loanId: args.loanId });

        try {
          return await Loan.deleteNote({ loanId: args.loanId, noteId: args.noteId });
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
  }),
});
