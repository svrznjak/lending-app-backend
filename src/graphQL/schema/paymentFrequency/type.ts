import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLBoolean,
  GraphQLFloat,
} from 'graphql';

export const paymentFrequencyType = new GraphQLObjectType({
  name: 'PaymentFrequencyType',
  fields: (): any => ({
    occurrence: { type: new GraphQLNonNull(paymentFrequencyOccurrence) },
    isStrict: { type: new GraphQLNonNull(GraphQLBoolean) },
    strictValue: { type: paymentFrequencyStrictValue },
    entryTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
  }),
});

export const paymentFrequencyInputType = new GraphQLInputObjectType({
  name: 'PaymentFrequencyInputType',
  fields: (): any => ({
    occurrence: { type: new GraphQLNonNull(paymentFrequencyOccurrence) },
    isStrict: { type: new GraphQLNonNull(GraphQLBoolean) },
    strictValue: { type: paymentFrequencyStrictValue },
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

const paymentFrequencyStrictValue = new GraphQLEnumType({
  name: 'PaymentFrequencyStrictValueType',
  values: {
    '1': { value: '1' },
    '2': { value: '2' },
    '3': { value: '3' },
    '4': { value: '4' },
    '5': { value: '5' },
    '6': { value: '6' },
    '7': { value: '7' },
    '8': { value: '8' },
    '9': { value: '9' },
    '10': { value: '10' },
    '11': { value: '11' },
    '12': { value: '12' },
    '13': { value: '13' },
    '14': { value: '14' },
    '15': { value: '15' },
    '16': { value: '16' },
    '17': { value: '17' },
    '18': { value: '18' },
    '19': { value: '19' },
    '20': { value: '20' },
    '21': { value: '21' },
    '22': { value: '22' },
    '23': { value: '23' },
    '24': { value: '24' },
    '25': { value: '25' },
    '26': { value: '26' },
    '27': { value: '27' },
    '28': { value: '28' },
    '29': { value: '29' },
    '30': { value: '30' },
    '31': { value: '31' },
  },
});
