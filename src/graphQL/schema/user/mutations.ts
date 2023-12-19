import { GraphQLFloat, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import { IUser, IUserInitializeInfo } from '../../../api/types/user/userInterface.js';
import { initializeUser, addNotificationToken, removeNotificationToken, getUserByAuthId } from '../../../api/user.js';
import { userType } from './type.js';

export default new GraphQLObjectType({
  name: 'UserMutations',
  fields: (): any => ({
    initializeUser: {
      type: userType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: new GraphQLNonNull(GraphQLString) },
        authId: { type: new GraphQLNonNull(GraphQLString) },
        currency: { type: new GraphQLNonNull(GraphQLString) },
        language: { type: new GraphQLNonNull(GraphQLString) },
        formattingLocale: { type: new GraphQLNonNull(GraphQLString) },
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
            formattingLocale: args.formattingLocale,
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
    // use User.addNotificationToken to add a notification token
    addNotificationToken: {
      type: userType,
      args: {
        notificationToken: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<IUser> {
        try {
          const authId = await context.getCurrentUserAuthIdOrThrowValidationError();
          const user = await getUserByAuthId(authId);
          return await addNotificationToken(user._id, args.notificationToken);
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
    // use User.removeNotificationToken to remove a notification token
    removeNotificationToken: {
      type: userType,
      args: {
        notificationToken: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<IUser> {
        try {
          const authId = await context.getCurrentUserAuthIdOrThrowValidationError();
          const user = await getUserByAuthId(authId);
          return await removeNotificationToken(user._id, args.notificationToken);
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
  }),
});
