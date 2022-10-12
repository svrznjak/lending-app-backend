import { IBudget } from './../../../api/types/budget/budgetInterface.js';
import { GraphQLEnumType, GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import { budgetsType } from '../budget/type.js';
import { loansType } from '../loan/type.js';
import { IUser } from '../../../api/types/user/userInterface.js';
import Budgets from '../../../api/budget.js';
import Loans from '../../../api/loan.js';
import { ILoan } from '../../../api/types/loan/loanInterface.js';

export const userType = new GraphQLObjectType({
  name: 'UserType',
  fields: (): any => ({
    _id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    authId: { type: new GraphQLNonNull(GraphQLString) },
    budgets: {
      type: new GraphQLList(budgetsType),
      resolve: async (parent: IUser): Promise<IBudget[]> => {
        return await Budgets.getAllFromUser({ userId: parent._id });
      },
    },
    loans: {
      type: new GraphQLList(loansType),
      resolve: async (parent: IUser): Promise<ILoan[]> => {
        return await Loans.getAllFromUser({ userId: parent._id });
      },
    },
    currency: { type: new GraphQLNonNull(GraphQLString) },
    language: { type: new GraphQLNonNull(GraphQLString) },
    subscription: { type: new GraphQLNonNull(userSubscriptionType) },
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
