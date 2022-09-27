import { IUser } from './../../../api/types/user/userInterface.js';
import { userType } from './type.js';
import { GraphQLObjectType } from 'graphql';
import { getUserByAuthId } from '../../../api/user.js';

export default new GraphQLObjectType({
  name: 'UserQueries',
  fields: (): any => ({
    user: {
      type: userType,
      async resolve(_parent: any, _args: any, context: any): Promise<IUser> {
        const authId = await context.getCurrentUserAuthIdOrThrowValidationError();
        return await getUserByAuthId(authId);
      },
    },
  }),
});
