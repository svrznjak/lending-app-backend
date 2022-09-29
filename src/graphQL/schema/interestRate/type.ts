import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLEnumType,
  GraphQLInt,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLBoolean,
} from 'graphql';

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
    expectedPayments: {
      type: new GraphQLNonNull(
        new GraphQLEnumType({
          name: 'expectedPaymentsType',
          values: {
            ONE_TIME: { value: 'ONE_TIME' },
            DAILY: { value: 'DAILY' },
            WEEKLY: { value: 'WEEKLY' },
            MONTHLY: { value: 'MONTHLY' },
            YEARLY: { value: 'YEARLY' },
          },
        }),
      ),
    },
    amount: { type: new GraphQLNonNull(GraphQLInt) },
    isCompouding: { type: new GraphQLNonNull(GraphQLBoolean) },
    entryTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
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
    expectedPayments: {
      type: new GraphQLNonNull(
        new GraphQLEnumType({
          name: 'expectedPaymentsInputType',
          values: {
            ONE_TIME: { value: 'ONE_TIME' },
            DAILY: { value: 'DAILY' },
            WEEKLY: { value: 'WEEKLY' },
            MONTHLY: { value: 'MONTHLY' },
            YEARLY: { value: 'YEARLY' },
          },
        }),
      ),
    },
    amount: { type: new GraphQLNonNull(GraphQLInt) },
    isCompouding: { type: new GraphQLNonNull(GraphQLBoolean) },
  }),
});
