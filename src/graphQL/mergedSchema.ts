import { GraphQLSchema, GraphQLObjectType } from 'graphql';

// Import queries from seperate datatypes
import userQueries from './schema/user/queries.js';

// Merge imported queries into GraphQLObjectType
const mergedQueries = new GraphQLObjectType({
  name: 'Queries',
  fields: (): any => ({
    userQueries,
  }),
});

// Import mutations from seperate datatypes
import userMutations from './schema/user/mutations.js';

// Merge imported mutations into GraphQLObjectType
const mergedMutations = new GraphQLObjectType({
  name: 'Mutations',
  fields: (): any => ({
    userMutations,
  }),
});

// Create new GraphQLSchema and export it as default
export default new GraphQLSchema({
  mutation: mergedMutations,
  query: mergedQueries,
});
