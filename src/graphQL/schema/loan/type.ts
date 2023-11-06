import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
  GraphQLList,
  GraphQLFloat,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLBoolean,
} from 'graphql';
import { interestRateType } from '../interestRate/type.js';
import { paymentFrequencyType } from '../paymentFrequency/type.js';
import { noteType } from '../note/type.js';
import { transactionAddressType } from '../transaction/type.js';

export const loanType = new GraphQLObjectType({
  name: 'LoanType',
  fields: (): any => ({
    _id: { type: new GraphQLNonNull(GraphQLID) },
    userId: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: new GraphQLNonNull(GraphQLString) },
    customerId: { type: GraphQLID },
    notes: { type: new GraphQLList(noteType) },
    openedTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
    closesTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
    interestRate: { type: new GraphQLNonNull(interestRateType) },
    paymentFrequency: { type: new GraphQLNonNull(paymentFrequencyType) },
    expectedPayments: { type: new GraphQLList(loanExpectedPayment) },
    status: {
      type: new GraphQLNonNull(loanStatus),
    },
    calculatedInvestedAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalPaidPrincipal: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedOutstandingInterest: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedPaidInterest: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalForgiven: { type: new GraphQLNonNull(GraphQLFloat) },
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

export const loanExpectedPayment = new GraphQLObjectType({
  name: 'loanExpectedPaymentType',
  fields: (): any => ({
    timestamp: { type: new GraphQLNonNull(GraphQLFloat) },
    principalPayment: { type: new GraphQLNonNull(GraphQLFloat) },
    interestPayment: { type: new GraphQLNonNull(GraphQLFloat) },
    notified: { type: new GraphQLNonNull(GraphQLBoolean) },
  }),
});

export const loanExpectedPaymentInput = new GraphQLInputObjectType({
  name: 'loanExpectedPaymentInputType',
  fields: (): any => ({
    timestamp: { type: new GraphQLNonNull(GraphQLFloat) },
    principalPayment: { type: new GraphQLNonNull(GraphQLFloat) },
    interestPayment: { type: new GraphQLNonNull(GraphQLFloat) },
  }),
});
export const loanStatusValues = new GraphQLEnumType({
  name: 'loanStatusValueType',
  values: {
    ACTIVE: { value: 'ACTIVE' },
    PAUSED: { value: 'PAUSED' },
    PAID: { value: 'PAID' },
    COMPLETED: { value: 'COMPLETED' },
    DEFAULTED: { value: 'DEFAULTED' },
  },
});

export const loanStatus = new GraphQLObjectType({
  name: 'loanStatusType',
  fields: (): any => ({
    current: { type: new GraphQLNonNull(loanStatusValues) },
    timestamp: { type: new GraphQLNonNull(GraphQLFloat) },
    previous: { type: loanStatus },
  }),
});

export const loanStatusInput = new GraphQLInputObjectType({
  name: 'loanStatusInputType',
  fields: (): any => ({
    current: { type: new GraphQLNonNull(loanStatusValues) },
    timestamp: { type: new GraphQLNonNull(GraphQLFloat) },
  }),
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
    _id: { type: new GraphQLNonNull(GraphQLID) },
    timestamp: { type: new GraphQLNonNull(GraphQLFloat) },
    description: { type: new GraphQLNonNull(GraphQLString) },
    totalInvested: { type: new GraphQLNonNull(GraphQLFloat) },
    totalPaidPrincipal: { type: new GraphQLNonNull(GraphQLFloat) },
    totalPaidInterest: { type: new GraphQLNonNull(GraphQLFloat) },
    totalRefunded: { type: new GraphQLNonNull(GraphQLFloat) },
    totalForgiven: { type: new GraphQLNonNull(GraphQLFloat) },
    from: { type: new GraphQLNonNull(transactionAddressType) },
    to: { type: new GraphQLNonNull(transactionAddressType) },
    invested: { type: new GraphQLNonNull(GraphQLFloat) },
    feeCharged: { type: new GraphQLNonNull(GraphQLFloat) },
    interestCharged: { type: new GraphQLNonNull(GraphQLFloat) },
    principalPaid: { type: new GraphQLNonNull(GraphQLFloat) },
    interestPaid: { type: new GraphQLNonNull(GraphQLFloat) },
    refundedAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    forgivenAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    outstandingPrincipal: { type: new GraphQLNonNull(GraphQLFloat) },
    outstandingInterest: { type: new GraphQLNonNull(GraphQLFloat) },
  }),
});

export const loanCalculatedValues = new GraphQLObjectType({
  name: 'LoanCalculatedValuesType',
  fields: (): any => ({
    calculatedTotalPaidPrincipal: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedOutstandingInterest: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedPaidInterest: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedLastTransactionTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedRelatedBudgets: { type: new GraphQLList(loanRelatedBudget) },
  }),
});
