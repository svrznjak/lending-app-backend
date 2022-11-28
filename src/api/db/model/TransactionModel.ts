import mongoose from 'mongoose';
import { ITransaction } from '../../types/transaction/transactionInterface.js';

import TransactionSchema from '../schema/TransactionSchema.js';

export interface ITransactionDocument extends mongoose.Document, Omit<ITransaction, '_id'> {}

interface TransactionModel extends mongoose.Model<ITransaction> {
  existsOneWithId: (id: string) => Promise<boolean>;
}

export default mongoose.model<ITransaction, TransactionModel>('Transactions', TransactionSchema);
