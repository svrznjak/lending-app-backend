import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLString,
} from 'graphql';

export const paymentFrequencyType = new GraphQLObjectType({
  name: 'PaymentFrequencyType',
  fields: (): any => ({
    occurrence: { type: new GraphQLNonNull(paymentFrequencyOccurrence) },
    isStrict: { type: new GraphQLNonNull(GraphQLBoolean) },
    strictValue: { type: GraphQLString },
    entryTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
  }),
});

export const paymentFrequencyInputType = new GraphQLInputObjectType({
  name: 'PaymentFrequencyInputType',
  fields: (): any => ({
    occurrence: { type: new GraphQLNonNull(paymentFrequencyOccurrenceInputType) },
    isStrict: { type: new GraphQLNonNull(GraphQLBoolean) },
    strictValue: { type: GraphQLString },
  }),
});

const paymentFrequencyOccurrence = new GraphQLEnumType({
  name: 'PaymentFrequencyOccurrenceType',
  values: {
    ONE_TIME: { value: 'ONE_TIME' },
    DAILY: { value: 'DAILY' },
    WEEKLY: { value: 'WEEKLY' },
    BIWEELKY: { value: 'BIWEELKY' },
    MONTHLY: { value: 'MONTHLY' },
    QUARTERLY: { value: 'QUARTERLY' },
    YEARLY: { value: 'YEARLY' },
  },
});

const paymentFrequencyOccurrenceInputType = new GraphQLEnumType({
  name: 'PaymentFrequencyOccurrenceInputType',
  values: {
    ONE_TIME: { value: 'ONE_TIME' },
    DAILY: { value: 'DAILY' },
    WEEKLY: { value: 'WEEKLY' },
    BIWEELKY: { value: 'BIWEELKY' },
    MONTHLY: { value: 'MONTHLY' },
    QUARTERLY: { value: 'QUARTERLY' },
    YEARLY: { value: 'YEARLY' },
  },
});
