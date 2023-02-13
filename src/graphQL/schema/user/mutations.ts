import { GraphQLFloat, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import { IUser, IUserInitializeInfo, IUserRegistrationInfo } from '../../../api/types/user/userInterface.js';
import { createUser, initializeUser } from '../../../api/user.js';
import { userType } from './type.js';

export default new GraphQLObjectType({
  name: 'UserMutations',
  fields: (): any => ({
    createUser: {
      type: userType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: new GraphQLNonNull(GraphQLString) },
        currency: { type: new GraphQLNonNull(GraphQLString) },
        language: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(_parent: any, args: any, _context: any): Promise<IUser> {
        try {
          const registrationInfo: IUserRegistrationInfo = {
            name: args.name,
            email: args.email,
            currency: args.currency,
            language: args.language,
            password: args.password,
          };
          return await createUser(registrationInfo);
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
    initializeUser: {
      type: userType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: new GraphQLNonNull(GraphQLString) },
        authId: { type: new GraphQLNonNull(GraphQLString) },
        currency: { type: new GraphQLNonNull(GraphQLString) },
        language: { type: new GraphQLNonNull(GraphQLString) },
        initialBudgetName: { type: new GraphQLNonNull(GraphQLString) },
        initialBudgetDescription: { type: new GraphQLNonNull(GraphQLString) },
        initialBudgetFunds: { type: new GraphQLNonNull(GraphQLFloat) },
        initiaTransactionDescription: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(_parent: any, args: any, _context: any): Promise<IUser> {
        try {
          const initializeInfo: IUserInitializeInfo = {
            name: args.name,
            email: args.email,
            authId: args.authId,
            currency: args.currency,
            language: args.language,
          };
          return await initializeUser(
            initializeInfo,
            args.initialBudgetName,
            args.initialBudgetDescription,
            args.initialBudgetFunds,
            args.initiaTransactionDescription,
          );
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
  }),
});
