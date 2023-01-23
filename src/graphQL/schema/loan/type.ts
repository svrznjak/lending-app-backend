import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
  GraphQLList,
  GraphQLFloat,
  GraphQLEnumType,
  GraphQLInputObjectType,
} from 'graphql';
import { interestRateType } from '../interestRate/type.js';
import { noteType } from '../note/type.js';
import { transactionAddressType } from '../transaction/type.js';

export const loanType = new GraphQLObjectType({
  name: 'LoanType',
  fields: (): any => ({
    _id: { type: new GraphQLNonNull(GraphQLID) },
    userId: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: new GraphQLNonNull(GraphQLString) },
    notes: { type: new GraphQLList(noteType) },
    openedTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
    closesTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
    interestRate: { type: new GraphQLNonNull(interestRateType) },
    status: {
      type: new GraphQLNonNull(loanStatus),
    },
    calculatedInvestedAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalPaidPrincipal: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalChargedInterest: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedPaidInterest: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedLastTransactionTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedRelatedBudgets: { type: new GraphQLList(loanRelatedBudget) },
    transactionList: { type: new GraphQLList(loanTransactionList) },
  }),
});

export const fundInputType = new GraphQLInputObjectType({
  name: 'FundInputType',
  fields: (): any => ({
    budgetId: { type: new GraphQLNonNull(GraphQLID) },
    amount: { type: new GraphQLNonNull(GraphQLFloat) },
  }),
});

export const loanStatus = new GraphQLEnumType({
  name: 'loanStatusType',
  values: {
    ACTIVE: { value: 'ACTIVE' },
    PAUSED: { value: 'PAUSED' },
    PAID: { value: 'PAID' },
    COMPLETED: { value: 'COMPLETED' },
    DEFAULTED: { value: 'DEFAULTED' },
  },
});

export const loanRelatedBudget = new GraphQLObjectType({
  name: 'LoanRelatedBudgetType',
  fields: (): any => ({
    budgetId: { type: new GraphQLNonNull(GraphQLID) },
    invested: { type: new GraphQLNonNull(GraphQLFloat) },
    withdrawn: { type: new GraphQLNonNull(GraphQLFloat) },
  }),
});

export const loanTransactionList = new GraphQLObjectType({
  name: 'loanTransactionListType',
  fields: (): any => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    timestamp: { type: new GraphQLNonNull(GraphQLFloat) },
    description: { type: new GraphQLNonNull(GraphQLString) },
    totalInvested: { type: new GraphQLNonNull(GraphQLFloat) },
    totalPaidPrincipal: { type: new GraphQLNonNull(GraphQLFloat) },
    totalPaidInterest: { type: new GraphQLNonNull(GraphQLFloat) },
    from: { type: new GraphQLNonNull(transactionAddressType) },
    to: { type: new GraphQLNonNull(transactionAddressType) },
    invested: { type: new GraphQLNonNull(GraphQLFloat) },
    feeCharged: { type: new GraphQLNonNull(GraphQLFloat) },
    interestCharged: { type: new GraphQLNonNull(GraphQLFloat) },
    principalPaid: { type: new GraphQLNonNull(GraphQLFloat) },
    interestPaid: { type: new GraphQLNonNull(GraphQLFloat) },
    outstandingPrincipal: { type: new GraphQLNonNull(GraphQLFloat) },
    outstandingInterest: { type: new GraphQLNonNull(GraphQLFloat) },
  }),
});

export const loanCalculatedValues = new GraphQLObjectType({
  name: 'LoanCalculatedValuesType',
  fields: (): any => ({
    calculatedTotalPaidPrincipal: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalChargedInterest: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedPaidInterest: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedLastTransactionTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedRelatedBudgets: { type: new GraphQLList(loanRelatedBudget) },
  }),
});
