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
import { interestRateInputType, interestRateType } from '../interestRate/type.js';
import { paymentFrequencyType } from '../paymentFrequency/type.js';
import { noteType } from '../note/type.js';
import { transactionAddressType } from '../transaction/type.js';
import { customerType } from '../customer/type.js';
import { ILoan } from '../../../api/types/loan/loanInterface.js';
import Customer from '../../../api/customer.js';
import { ICustomer } from '../../../api/types/customer/customerInterface.js';

export const loanType = new GraphQLObjectType({
  name: 'LoanType',
  fields: (): any => ({
    _id: { type: new GraphQLNonNull(GraphQLID) },
    userId: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: new GraphQLNonNull(GraphQLString) },
    customer: {
      type: customerType,
      resolve: async (parent: ILoan): Promise<ICustomer | undefined> => {
        if (parent.customerId === undefined) {
          return undefined;
        }
        return await Customer.getOneFromUser({
          userId: parent.userId,
          customerId: parent.customerId.toString(),
        });
      },
    },
    notes: { type: new GraphQLList(noteType) },
    openedTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
    closesTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
    paymentFrequency: { type: new GraphQLNonNull(paymentFrequencyType) },
    expectedPayments: { type: new GraphQLList(loanExpectedPayment) },
    status: {
      type: new GraphQLNonNull(loanStatus),
    },
    calculatedInvestedAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedOutstandingPrincipal: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalPaidPrincipal: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedOutstandingInterest: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedOutstandingFees: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedPaidInterest: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedPaidFees: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalForgivenPrincipal: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalForgivenInterest: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalForgivenFees: { type: new GraphQLNonNull(GraphQLFloat) },
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
    interestRate: { type: new GraphQLNonNull(interestRateInputType) },
  }),
});

export const loanExpectedPayment = new GraphQLObjectType({
  name: 'loanExpectedPaymentType',
  fields: (): any => ({
    paymentDate: { type: new GraphQLNonNull(GraphQLFloat) },
    outstandingPrincipalBeforePayment: { type: new GraphQLNonNull(GraphQLFloat) },
    totalPaidPrincipalBeforePayment: { type: new GraphQLNonNull(GraphQLFloat) },
    principalPayment: { type: new GraphQLNonNull(GraphQLFloat) },
    interestPayment: { type: new GraphQLNonNull(GraphQLFloat) },
    notified: { type: new GraphQLNonNull(GraphQLBoolean) },
  }),
});

export const loanExpectedPaymentInput = new GraphQLInputObjectType({
  name: 'loanExpectedPaymentInputType',
  fields: (): any => ({
    paymentDate: { type: new GraphQLNonNull(GraphQLFloat) },
    outstandingPrincipalBeforePayment: { type: new GraphQLNonNull(GraphQLFloat) },
    totalPaidPrincipalBeforePayment: { type: new GraphQLNonNull(GraphQLFloat) },
    principalPayment: { type: new GraphQLNonNull(GraphQLFloat) },
    interestPayment: { type: new GraphQLNonNull(GraphQLFloat) },
    notified: { type: new GraphQLNonNull(GraphQLBoolean) },
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

const loanPaymentDetailsSchema = new GraphQLObjectType({
  name: 'LoanPaymentDetailsType',
  fields: (): any => ({
    budgetId: { type: GraphQLID },
    amount: { type: new GraphQLNonNull(GraphQLFloat) },
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
    totalPaidFees: { type: new GraphQLNonNull(GraphQLFloat) },
    totalForgivenPrincipal: { type: new GraphQLNonNull(GraphQLFloat) },
    totalForgivenInterest: { type: new GraphQLNonNull(GraphQLFloat) },
    totalForgivenFees: { type: new GraphQLNonNull(GraphQLFloat) },
    from: { type: new GraphQLNonNull(transactionAddressType) },
    to: { type: new GraphQLNonNull(transactionAddressType) },
    invested: { type: new GraphQLNonNull(GraphQLFloat) },
    feeCharged: { type: new GraphQLNonNull(GraphQLFloat) },
    interestCharged: { type: new GraphQLNonNull(GraphQLFloat) },
    principalPaid: { type: new GraphQLList(loanPaymentDetailsSchema) },
    principalForgiven: { type: new GraphQLList(loanPaymentDetailsSchema) },
    interestPaid: { type: new GraphQLList(loanPaymentDetailsSchema) },
    interestForgiven: { type: new GraphQLList(loanPaymentDetailsSchema) },
    feePaid: { type: new GraphQLList(loanPaymentDetailsSchema) },
    feeForgiven: { type: new GraphQLList(loanPaymentDetailsSchema) },
    refundedAmount: { type: new GraphQLList(loanPaymentDetailsSchema) },
    outstandingPrincipal: { type: new GraphQLNonNull(GraphQLFloat) },
    outstandingInterest: { type: new GraphQLNonNull(GraphQLFloat) },
    outstandingFees: { type: new GraphQLNonNull(GraphQLFloat) },
    investmentStats: { type: new GraphQLList(loanInvestmentStats) },
  }),
});

export const loanInvestmentStats = new GraphQLObjectType({
  name: 'LoanInvestmentStatsType',
  fields: (): any => ({
    budgetId: { type: new GraphQLNonNull(GraphQLID) },
    initialInvestment: { type: new GraphQLNonNull(GraphQLFloat) },
    outstandingPrincipal: { type: new GraphQLNonNull(GraphQLFloat) },
    totalPaidPrincipal: { type: new GraphQLNonNull(GraphQLFloat) },
    outstandingInterest: { type: new GraphQLNonNull(GraphQLFloat) },
    totalPaidInterest: { type: new GraphQLNonNull(GraphQLFloat) },
    totalForgivenPrincipal: { type: new GraphQLNonNull(GraphQLFloat) },
    totalForgivenInterest: { type: new GraphQLNonNull(GraphQLFloat) },
    interestRate: { type: new GraphQLNonNull(interestRateType) },
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
