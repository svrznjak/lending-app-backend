import { ITransaction } from './../../../api/types/transaction/transactionInterface.js';
import { GraphQLFloat, GraphQLID } from 'graphql';
import { GraphQLObjectType, GraphQLNonNull, GraphQLString } from 'graphql';
import { getUserByAuthId } from '../../../api/user.js';

import Transaction from '../../../api/transaction.js';
import { transactionType } from './type.js';
import TransactionModel from '../../../api/db/model/TransactionModel.js';
export default new GraphQLObjectType({
  name: 'transactionMutations',
  fields: (): any => ({
    edit: {
      type: transactionType,
      args: {
        transactionId: { type: new GraphQLNonNull(GraphQLID) },
        transactionTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
        description: { type: new GraphQLNonNull(GraphQLString) },
        amount: { type: new GraphQLNonNull(GraphQLFloat) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ITransaction> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const Mongo_user = await getUserByAuthId(userAuthId);
        const Mongo_transaction: any = await TransactionModel.findById(args.transactionId);
        if (Mongo_transaction.userId.toString() !== Mongo_user._id.toString()) throw new Error('Unauthorized');

        try {
          const updatedTransaction = await Transaction.edit(args.transactionId, {
            transactionTimestamp: args.transactionTimestamp,
            description: args.description,
            amount: args.amount,
            entryTimestamp: new Date().getTime(),
          });

          return updatedTransaction;
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
    delete: {
      type: transactionType,
      args: {
        transactionId: { type: new GraphQLNonNull(GraphQLID) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ITransaction> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const Mongo_user = await getUserByAuthId(userAuthId);
        const Mongo_transaction: any = await TransactionModel.findById(args.transactionId);
        if (Mongo_transaction.userId.toString() !== Mongo_user._id.toString()) throw new Error('Unauthorized');

        try {
          return await Transaction.delete(args.transactionId);
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
  }),
});
