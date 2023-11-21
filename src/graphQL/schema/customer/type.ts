import { GraphQLObjectType, GraphQLNonNull, GraphQLID, GraphQLString, GraphQLList, GraphQLBoolean } from 'graphql';
import { noteType } from '../note/type.js';

export const customerType = new GraphQLObjectType({
  name: 'LoanType',
  fields: (): any => ({
    _id: { type: new GraphQLNonNull(GraphQLID) },
    userId: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: GraphQLString },
    phone: { type: GraphQLString },
    address: { type: GraphQLString },
    notes: { type: new GraphQLList(noteType) },
    isArchived: { type: new GraphQLNonNull(GraphQLBoolean) },
  }),
});
