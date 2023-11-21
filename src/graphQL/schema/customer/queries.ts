import { GraphQLID, GraphQLList, GraphQLObjectType } from 'graphql';
import { getUserByAuthId } from '../../../api/user.js';
import { customerType } from './type.js';
import Customer from '../../../api/customer.js';
import { ICustomer } from '../../../api/types/customer/customerInterface.js';

export default new GraphQLObjectType({
  name: 'CustomerQueries',
  fields: (): any => ({
    customers: {
      type: new GraphQLList(customerType),
      resolve: async (_parent: any, _args: any, context: any): Promise<ICustomer[]> => {
        const authId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(authId);
        return await Customer.getAllFromUser({
          userId: user._id.toString(),
        });
      },
    },
    customer: {
      type: customerType,
      args: {
        customerId: { type: GraphQLID },
      },
      resolve: async (_parent: any, args: any, context: any): Promise<ICustomer> => {
        const authId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(authId);
        return await Customer.getOneFromUser({
          userId: user._id.toString(),
          customerId: args.customerId,
        });
      },
    },
  }),
});
