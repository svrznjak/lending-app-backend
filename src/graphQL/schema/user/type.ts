import {
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';

export const userType = new GraphQLObjectType({
  name: 'UserType',
  fields: (): any => ({
    _id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    authId: { type: new GraphQLNonNull(GraphQLString) },
    budgets: { type: new GraphQLList(budgetsType) },
    loans: { type: new GraphQLList(loansType) },
    currency: { type: new GraphQLNonNull(GraphQLString) },
    language: { type: new GraphQLNonNull(GraphQLString) },
    subscription: { type: new GraphQLNonNull(userSubscriptionType) },
  }),
});

export const budgetsType = new GraphQLObjectType({
  name: 'BudgetType',
  fields: (): any => ({
    _id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: new GraphQLNonNull(GraphQLString) },
    defaultInterestRate: { type: new GraphQLNonNull(interestRateType) },
    calculatedTotalAmount: { type: new GraphQLNonNull(GraphQLInt) },
    calculatedLendedAmount: { type: new GraphQLNonNull(GraphQLInt) },
  }),
});
const loansType = new GraphQLObjectType({
  name: 'LoansType',
  fields: (): any => ({
    _id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: new GraphQLNonNull(GraphQLString) },
    notes: { type: new GraphQLList(noteType) },
    openedTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
    closesTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
    interestRate: { type: new GraphQLNonNull(interestRateType) },
    initialPrincipal: { type: new GraphQLNonNull(GraphQLInt) },
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
    calculatedTotalPaidPrincipal: { type: new GraphQLNonNull(GraphQLInt) },
    calculatedChargedInterest: { type: new GraphQLNonNull(GraphQLInt) },
    calculatedPaidInterest: { type: new GraphQLNonNull(GraphQLInt) },
  }),
});
export const interestRateType = new GraphQLObjectType({
  name: 'InterestRateType',
  fields: (): any => ({
    type: {
      type: new GraphQLNonNull(
        new GraphQLEnumType({
          name: 'DurationType',
          values: {
            PERCENTAGE_PER_DURATION: { value: 'PERCENTAGE_PER_DURATION' },
            FIXED_PER_DURATION: { value: 'FIXED_PER_DURATION' },
          },
        }),
      ),
    },
    duration: {
      type: new GraphQLNonNull(
        new GraphQLEnumType({
          name: 'Duration',
          values: {
            DAY: { value: 'DAY' },
            WEEK: { value: 'WEEK' },
            MONTH: { value: 'MONTH' },
            YEAR: { value: 'YEAR' },
            FULL_DURATION: { value: 'FULL_DURATION' },
          },
        }),
      ),
    },
    amount: { type: new GraphQLNonNull(GraphQLInt) },
    entryTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
    revisions: { type: interestRateType },
  }),
});
const noteType = new GraphQLObjectType({
  name: 'NoteType',
  fields: (): any => ({
    _id: { type: new GraphQLNonNull(GraphQLID) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    entryTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
    revisions: { type: noteType },
  }),
});
const userSubscriptionType = new GraphQLObjectType({
  name: 'UserSubscriptionType',
  fields: (): any => ({
    revenuecatId: { type: new GraphQLNonNull(GraphQLID) },
    type: {
      type: new GraphQLNonNull(
        new GraphQLEnumType({
          name: 'subscriptionType',
          values: {
            FREE: { value: 'FREE' },
            STANDARD: { value: 'STANDARD' },
            PREMIUM: { value: 'PREMIUM' },
          },
        }),
      ),
    },
  }),
});

export const interestRateInputType = new GraphQLInputObjectType({
  name: 'InterestRateInputType',
  fields: (): any => ({
    type: {
      type: new GraphQLNonNull(
        new GraphQLEnumType({
          name: 'DurationTypeInput',
          values: {
            PERCENTAGE_PER_DURATION: { value: 'PERCENTAGE_PER_DURATION' },
            FIXED_PER_DURATION: { value: 'FIXED_PER_DURATION' },
          },
        }),
      ),
    },
    duration: {
      type: new GraphQLNonNull(
        new GraphQLEnumType({
          name: 'DurationInput',
          values: {
            DAY: { value: 'DAY' },
            WEEK: { value: 'WEEK' },
            MONTH: { value: 'MONTH' },
            YEAR: { value: 'YEAR' },
            FULL_DURATION: { value: 'FULL_DURATION' },
          },
        }),
      ),
    },
    amount: { type: new GraphQLNonNull(GraphQLInt) },
  }),
});
