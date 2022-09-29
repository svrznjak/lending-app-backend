import { GraphQLObjectType, GraphQLNonNull, GraphQLID, GraphQLString, GraphQLFloat, GraphQLBoolean } from 'graphql';
import { interestRateType } from '../interestRate/type.js';

export const budgetsType = new GraphQLObjectType({
  name: 'BudgetType',
  fields: (): any => ({
    _id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: new GraphQLNonNull(GraphQLString) },
    defaultInterestRate: { type: new GraphQLNonNull(interestRateType) },
    calculatedTotalAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedLendedAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    isArchived: { type: new GraphQLNonNull(GraphQLBoolean) },
  }),
});
