import { GraphQLFloat } from 'graphql';
import { GraphQLObjectType, GraphQLNonNull, GraphQLString, GraphQLInt, GraphQLID } from 'graphql';
import { IBudget } from '../../../api/types/budget/budgetInterface.js';
import { transactionHelpers } from '../../../api/types/transaction/transactionHelpers.js';
import { getUserByAuthId } from '../../../api/user.js';
import { interestRateInputType } from '../interestRate/type.js';
import { paymentFrequencyInputType } from '../paymentFrequency/type.js';

import Budget from '../../../api/budget.js';
import { budgetsType } from './type.js';
import { transactionType } from '../transaction/type.js';
import { ITransaction } from '../../../api/types/transaction/transactionInterface.js';
export default new GraphQLObjectType({
  name: 'BudgetMutations',
  fields: (): any => ({
    createBudget: {
      type: budgetsType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        description: { type: new GraphQLNonNull(GraphQLString) },
        defaultInterestRate: { type: new GraphQLNonNull(interestRateInputType) },
        defaultPaymentFrequency: { type: new GraphQLNonNull(paymentFrequencyInputType) },
        initialAmount: { type: new GraphQLNonNull(GraphQLInt) },
        initialTransactionDescription: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<IBudget> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);

        try {
          const newBudgetInfo: Pick<
            IBudget,
            'name' | 'description' | 'defaultInterestRate' | 'defaultPaymentFrequency'
          > = {
            name: args.name,
            description: args.description,
            defaultInterestRate: args.defaultInterestRate,
            defaultPaymentFrequency: args.defaultPaymentFrequency,
          };
          return await Budget.create(user._id, newBudgetInfo, args.initialAmount, args.initialTransactionDescription);
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
    editBudget: {
      type: budgetsType,
      args: {
        budgetId: { type: new GraphQLNonNull(GraphQLID) },
        name: { type: new GraphQLNonNull(GraphQLString) },
        description: { type: new GraphQLNonNull(GraphQLString) },
        defaultInterestRate: { type: new GraphQLNonNull(interestRateInputType) },
        defaultPaymentFrequency: { type: new GraphQLNonNull(paymentFrequencyInputType) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<IBudget> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);
        await Budget.getOneFromUser({ userId: user._id, budgetId: args.budgetId }); // check if user has access to budget

        try {
          return await Budget.edit({
            budgetId: args.budgetId,
            name: args.name,
            description: args.description,
            defaultInterestRateType: args.defaultInterestRate.type,
            defaultInterestRateDuration: args.defaultInterestRate.duration,
            defaultInterestRateAmount: args.defaultInterestRate.amount,
            defaultInterestRateIsCompounding: args.defaultInterestRate.isCompounding,
            defaultPaymentFrequencyOccurrence: args.defaultPaymentFrequency.occurrence,
            defaultPaymentFrequencyIsStrict: args.defaultPaymentFrequency.isStrict,
            defaultPaymentFrequencyStrictValue: args.defaultPaymentFrequency.strictValue,
          });
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
    addFundsToBudget: {
      type: transactionType,
      args: {
        budgetId: { type: new GraphQLNonNull(GraphQLID) },
        description: { type: new GraphQLNonNull(GraphQLString) },
        transactionTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
        amount: { type: new GraphQLNonNull(GraphQLFloat) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ITransaction> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);
        await Budget.getOneFromUser({ userId: user._id, budgetId: args.budgetId });

        try {
          return await Budget.addFundsFromOutside({
            userId: user._id,
            budgetId: args.budgetId,
            transactionTimestamp: args.transactionTimestamp,
            description: args.description,
            amount: args.amount,
          });
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
    withdrawFundsFromBudget: {
      type: transactionType,
      args: {
        budgetId: { type: new GraphQLNonNull(GraphQLID) },
        description: { type: new GraphQLNonNull(GraphQLString) },
        transactionTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
        amount: { type: new GraphQLNonNull(GraphQLFloat) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ITransaction> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);
        await Budget.getOneFromUser({ userId: user._id, budgetId: args.budgetId });

        try {
          return await Budget.withdrawFundsToOutside({
            userId: user._id,
            budgetId: args.budgetId,
            transactionTimestamp: args.transactionTimestamp,
            description: args.description,
            amount: args.amount,
          });
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
    archiveBudget: {
      type: budgetsType,
      args: {
        budgetId: { type: new GraphQLNonNull(GraphQLID) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<IBudget> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);
        const budget: any = await Budget.getOneFromUser({ userId: user._id, budgetId: args.budgetId });

        try {
          return await Budget.setIsArchived({
            budgetId: budget._id,
            isArchived: true,
          });
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
    unarchiveBudget: {
      type: budgetsType,
      args: {
        budgetId: { type: new GraphQLNonNull(GraphQLID) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<IBudget> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);
        const budget: any = await Budget.getOneFromUser({ userId: user._id, budgetId: args.budgetId });

        try {
          return await Budget.setIsArchived({
            budgetId: budget._id,
            isArchived: false,
          });
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
  }),
});
