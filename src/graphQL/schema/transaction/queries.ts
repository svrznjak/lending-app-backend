import { ITransaction } from './../../../api/types/transaction/transactionInterface.js';
import { transactionType } from './../transaction/type.js';
import { GraphQLID, GraphQLNonNull, GraphQLObjectType } from 'graphql';
import { getUserByAuthId } from '../../../api/user.js';
import Transaction from '../../../api/transaction.js';
import { IUser } from '../../../api/types/user/userInterface.js';

export default new GraphQLObjectType({
  name: 'TransactionQueries',
  fields: (): any => ({
    transaction: {
      type: transactionType,
      args: {
        transactionId: { type: new GraphQLNonNull(GraphQLID) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ITransaction> {
        const authId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user: IUser = await getUserByAuthId(authId);
        const transaction: ITransaction = await Transaction.getOne({ transactionId: args.transactionId });
        if (transaction.userId !== user._id) throw new Error('Unauthorized');

        return transaction;
      },
    },
  }),
});
