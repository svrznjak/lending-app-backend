import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLList,
} from 'graphql';
import { interestRateType } from '../interestRate/type.js';
import { paymentFrequencyType } from '../paymentFrequency/type.js';
import { transactionAddressType } from '../transaction/type.js';

export const budgetsType = new GraphQLObjectType({
  name: 'BudgetType',
  fields: (): any => ({
    _id: { type: new GraphQLNonNull(GraphQLID) },
    userId: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    defaultInterestRate: { type: new GraphQLNonNull(interestRateType) },
    defaultPaymentFrequency: { type: new GraphQLNonNull(paymentFrequencyType) },
    isArchived: { type: new GraphQLNonNull(GraphQLBoolean) },
    currentStats: { type: new GraphQLNonNull(budgetStatsType) },
    transactionList: { type: new GraphQLList(budgetTransaction) },
  }),
});

export const budgetsWithTransactionListType = new GraphQLObjectType({
  name: 'BudgetWithTransactionListType',
  fields: (): any => ({
    _id: { type: new GraphQLNonNull(GraphQLID) },
    userId: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    defaultInterestRate: { type: new GraphQLNonNull(interestRateType) },
    defaultPaymentFrequency: { type: new GraphQLNonNull(paymentFrequencyType) },
    isArchived: { type: new GraphQLNonNull(GraphQLBoolean) },
    currentStats: { type: new GraphQLNonNull(budgetStatsType) },
    transactionList: { type: new GraphQLList(budgetTransaction) },
  }),
});

export const budgetTransaction = new GraphQLObjectType({
  name: 'BudgetTransactionType',
  fields: (): any => ({
    _id: { type: new GraphQLNonNull(GraphQLID) },
    timestamp: { type: new GraphQLNonNull(GraphQLFloat) },
    description: { type: GraphQLString },
    from: { type: new GraphQLNonNull(transactionAddressType) },
    to: { type: new GraphQLNonNull(transactionAddressType) },
    amount: { type: new GraphQLNonNull(GraphQLFloat) },
    budgetStats: { type: new GraphQLNonNull(budgetStatsType) },
  }),
});

export const budgetStatsType = new GraphQLObjectType({
  name: 'BudgetStatsType',
  fields: (): any => ({
    totalInvestedAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    totalWithdrawnAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    totalAvailableAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    currentlyPaidBackPrincipalAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    currentlyEarnedInterestAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    currentlyEarnedFeesAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    currentlyLendedPrincipalToLiveLoansAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    totalLostPrincipalToCompletedAndDefaultedLoansAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    totalGains: { type: new GraphQLNonNull(GraphQLFloat) },
    totalForgivenAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    totalLentAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    totalAssociatedLoans: { type: new GraphQLNonNull(GraphQLFloat) },
    totalAssociatedLiveLoans: { type: new GraphQLNonNull(GraphQLFloat) },
    avarageAssociatedLoanDuration: { type: GraphQLFloat },
    avarageAssociatedLoanAmount: { type: GraphQLFloat },
  }),
});
