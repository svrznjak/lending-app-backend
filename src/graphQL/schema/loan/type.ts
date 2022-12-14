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

export const loansType = new GraphQLObjectType({
  name: 'LoansType',
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
      type: new GraphQLNonNull(
        new GraphQLEnumType({
          name: 'type',
          values: {
            ACTIVE: { value: 'ACTIVE' },
            PAUSED: { value: 'PAUSED' },
            PAID: { value: 'PAID' },
            CLOSED: { value: 'CLOSED' },
            DEFAULTED: { value: 'DEFAULTED' },
          },
        }),
      ),
    },
    calculatedInvestedAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalPaidPrincipal: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedChargedInterest: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedPaidInterest: { type: new GraphQLNonNull(GraphQLFloat) },
  }),
});

export const fundInputType = new GraphQLInputObjectType({
  name: 'FundInputType',
  fields: (): any => ({
    budgetId: { type: new GraphQLNonNull(GraphQLID) },
    amount: { type: new GraphQLNonNull(GraphQLFloat) },
  }),
});

export const loanCalculatedValues = new GraphQLObjectType({
  name: 'LoanCalculatedValuesType',
  fields: (): any => ({
    calculatedTotalPaidPrincipal: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedChargedInterest: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedPaidInterest: { type: new GraphQLNonNull(GraphQLFloat) },
  }),
});
