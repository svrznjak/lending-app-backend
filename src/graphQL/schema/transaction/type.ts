import { GraphQLEnumType, GraphQLFloat, GraphQLID, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';

export const transactionType = new GraphQLObjectType({
  name: 'TransactionType',
  fields: (): any => ({
    _id: { type: new GraphQLNonNull(GraphQLID) },
    transactionTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
    description: { type: new GraphQLNonNull(GraphQLString) },
    from: { type: new GraphQLNonNull(transactionAddressType) },
    to: { type: new GraphQLNonNull(transactionAddressType) },
    amount: { type: new GraphQLNonNull(GraphQLFloat) },
    entryTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
  }),
});

const transactionAddressType = new GraphQLObjectType({
  name: 'TransactionAddressType',
  fields: (): any => ({
    datatype: {
      type: new GraphQLNonNull(
        new GraphQLEnumType({
          name: 'addressIdType',
          values: {
            BUDGET: { value: 'BUDGET' },
            LOAN: { value: 'LOAN' },
            INTEREST: { value: 'INTEREST' },
            OUTSIDE: { value: 'OUTSIDE' },
          },
        }),
      ),
    },
    addressId: { type: new GraphQLNonNull(GraphQLID) },
  }),
});
