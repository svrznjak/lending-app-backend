import { GraphQLSchema, GraphQLObjectType } from 'graphql';

// Import queries from seperate datatypes
import userQueries from './schema/user/queries.js';
import budgetQueries from './schema/budget/queries.js';
import loanQueries from './schema/loan/queries.js';
import customerQueries from './schema/customer/queries.js';
import transactionQueries from './schema/transaction/queries.js';

// Merge imported queries into GraphQLObjectType
const mergedQueries = new GraphQLObjectType({
  name: 'Queries',
  fields: (): any => ({
    User: {
      type: userQueries,
      resolve: () => ({}),
    },
    Budget: {
      type: budgetQueries,
      resolve: () => ({}),
    },
    Loan: {
      type: loanQueries,
      resolve: () => ({}),
    },
    Customer: {
      type: customerQueries,
      resolve: () => ({}),
    },
    Transaction: {
      type: transactionQueries,
      resolve: () => ({}),
    },
  }),
});

// Import mutations from seperate datatypes
import userMutations from './schema/user/mutations.js';
import budgetMutations from './schema/budget/mutations.js';
import loanMutations from './schema/loan/mutations.js';
import customerMutations from './schema/customer/mutations.js';
import transactionMutations from './schema/transaction/mutations.js';

// Merge imported mutations into GraphQLObjectType
const mergedMutations = new GraphQLObjectType({
  name: 'Mutations',
  fields: (): any => ({
    User: {
      type: userMutations,
      resolve: () => ({}),
    },
    Budget: {
      type: budgetMutations,
      resolve: () => ({}),
    },
    Loan: {
      type: loanMutations,
      resolve: () => ({}),
    },
    Customer: {
      type: customerMutations,
      resolve: () => ({}),
    },
    Transaction: {
      type: transactionMutations,
      resolve: () => ({}),
    },
  }),
});

// Create new GraphQLSchema and export it as default
export default new GraphQLSchema({
  mutation: mergedMutations,
  query: mergedQueries,
});
