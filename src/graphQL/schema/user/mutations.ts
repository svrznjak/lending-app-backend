import { GraphQLInt, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import { IUser, IUserRegistrationInfo } from '../../../api/types/user/userInterface.js';
import { createUser, getUserByAuthId } from '../../../api/user.js';
import Budget from '../../../api/budget.js';
import { budgetsType, interestRateInputType, userType } from './type.js';
import { IBudget } from '../../../api/types/budget/budgetInterface.js';
import { transactionHelpers } from '../../../api/types/transaction/transactionHelpers.js';

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
          throw new Error(err);
        }
      },
    },
    createBudget: {
      type: budgetsType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        description: { type: new GraphQLNonNull(GraphQLString) },
        defaultInterestRate: { type: new GraphQLNonNull(interestRateInputType) },
        initialAmount: { type: new GraphQLNonNull(GraphQLInt) },
        initialTransactionDescription: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<IBudget> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);
        const now = transactionHelpers.validate.entryTimestamp(new Date().getTime());
        args.defaultInterestRate.entryTimestamp = now;

        const session = await global.mongooseConnection.startSession();
        try {
          session.startTransaction();
          const newBudgetInfo: Pick<IBudget, 'name' | 'description' | 'defaultInterestRate'> = {
            name: args.name,
            description: args.description,
            defaultInterestRate: args.defaultInterestRate,
          };
          const newBudget = await Budget.create(user._id.toString(), newBudgetInfo, { session });
          if (args.initialAmount !== 0)
            await Budget.addAmountFromOutside(
              {
                userId: user._id.toString(),
                budgetId: newBudget._id.toString(),
                transactionTimestamp: now,
                description: args.initialTransactionDescription,
                amount: args.initialAmount,
              },
              { session },
            );

          await session.commitTransaction();
          return newBudget;
        } catch (err: any) {
          await session.abortTransaction();
          console.log(err.message);
          throw new Error(err);
        } finally {
          await session.endSession();
        }
      },
    },
  }),
});
