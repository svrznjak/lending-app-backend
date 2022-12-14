import { GraphQLObjectType, GraphQLNonNull, GraphQLID, GraphQLString, GraphQLFloat, GraphQLBoolean } from 'graphql';
import { interestRateType } from '../interestRate/type.js';

export const budgetsType = new GraphQLObjectType({
  name: 'BudgetType',
  fields: (): any => ({
    _id: { type: new GraphQLNonNull(GraphQLID) },
    userId: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: new GraphQLNonNull(GraphQLString) },
    defaultInterestRate: { type: new GraphQLNonNull(interestRateType) },
    calculatedTotalInvestedAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalWithdrawnAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalAvailableAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    isArchived: { type: new GraphQLNonNull(GraphQLBoolean) },
  }),
});

export const budgetCalculatedValues = new GraphQLObjectType({
  name: 'BudgetCalculatedValuesType',
  fields: (): any => ({
    _id: { type: new GraphQLNonNull(GraphQLID) },
    calculatedTotalInvestedAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalWithdrawnAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    calculatedTotalAvailableAmount: { type: new GraphQLNonNull(GraphQLFloat) },
  }),
});
