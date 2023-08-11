import { GraphQLObjectType, GraphQLNonNull, GraphQLID, GraphQLString, GraphQLFloat, GraphQLBoolean } from 'graphql';
import { interestRateType } from '../interestRate/type.js';
import { paymentFrequencyType } from '../paymentFrequency/type.js';

export const budgetsType = new GraphQLObjectType({
  name: 'BudgetType',
  fields: (): any => ({
    _id: { type: new GraphQLNonNull(GraphQLID) },
    userId: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: new GraphQLNonNull(GraphQLString) },
    defaultInterestRate: { type: new GraphQLNonNull(interestRateType) },
    defaultPaymentFrequency: { type: new GraphQLNonNull(paymentFrequencyType) },
    calculatedTotalInvestedAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalWithdrawnAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalAvailableAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedCurrentlyLendedPrincipalToLiveLoansAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedCurrentlyEarnedInterestAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalLostPrincipalToCompletedAndDefaultedLoansAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalGains: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalLentAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalAssociatedLoans: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalAssociatedLiveLoans: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedAvarageAssociatedLoanDuration: { type: GraphQLFloat },
    calculatedAvarageAssociatedLoanAmount: { type: GraphQLFloat },
    isArchived: { type: new GraphQLNonNull(GraphQLBoolean) },
  }),
});

export const budgetCalculatedValues = new GraphQLObjectType({
  name: 'BudgetCalculatedValuesType',
  fields: (): any => ({
    _id: { type: new GraphQLNonNull(GraphQLID) },
    calculatedTotalInvestedAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalWithdrawnAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalAvailableAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedCurrentlyLendedPrincipalToLiveLoansAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedCurrentlyEarnedInterestAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalLostPrincipalToCompletedAndDefaultedLoansAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalGains: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalLentAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalAssociatedLoans: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalAssociatedLiveLoans: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedAvarageAssociatedLoanDuration: { type: GraphQLFloat },
    calculatedAvarageAssociatedLoanAmount: { type: GraphQLFloat },
  }),
});
