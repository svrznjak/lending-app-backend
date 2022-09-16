import TransactionModel from './db/model/TransactionModel.js';
import { transactionHelpers } from './types/transaction/transactionHelpers.js';
import { ITransaction } from './types/transaction/transactionInterface.js';
import { ITransactionAddress } from './types/transactionAddress/transactionAddressInterface.js';
import { transactionAddressHelpers } from './types/transactionAddress/transactionAddressHelpers.js';
import mongoose from 'mongoose';

export default {
  add: async function addTransaction(
    userId: string,
    transaction: Pick<
      ITransaction,
      'transactionTimestamp' | 'description' | 'from' | 'to' | 'amount' | 'entryTimestamp'
    >,
  ): Promise<Pick<ITransaction, 'transactionTimestamp' | 'description' | 'from' | 'to' | 'amount' | 'entryTimestamp'>> {
    transactionHelpers.validate(transaction);
    transactionHelpers.sanitize(transaction);
    const validatedTransaction = {
      _id: new mongoose.Types.ObjectId().toString(),
      userId: userId,
      ...transaction,
      revisions: [],
    } as ITransaction;
    transactionHelpers.runtimeCast(validatedTransaction);
    try {
      const newTransactionInDB: any = await new TransactionModel(validatedTransaction).save();
      const newTransaction: ITransaction = {
        _id: newTransactionInDB._id.toString(),
        userId: newTransactionInDB.userId.toString(),
        transactionTimestamp: newTransactionInDB.transactionTimestamp,
        description: newTransactionInDB.description,
        from: {
          datatype: newTransactionInDB.from.datatype,
          addressId: newTransactionInDB.from.addressId,
        },
        to: {
          datatype: newTransactionInDB.to.datatype,
          addressId: newTransactionInDB.to.addressId,
        },
        amount: newTransactionInDB.amount,
        entryTimestamp: newTransactionInDB.entryTimestamp,
        revisions: newTransactionInDB.revisions,
      };
      return transactionHelpers.runtimeCast(newTransaction);
    } catch (err) {
      console.log(err);
      throw new Error('Transaction creation failed!');
    }
  },
  edit: async function editTransaction(
    transactionId: string,
    newTransaction: Pick<
      ITransaction,
      'transactionTimestamp' | 'description' | 'from' | 'to' | 'amount' | 'entryTimestamp'
    >,
  ): Promise<ITransaction> {
    // check if newTransaction values are valid for entry
    transactionHelpers.validate(newTransaction);
    transactionHelpers.sanitize(newTransaction);
    // get old transaction
    const transaction: any = await TransactionModel.findById(transactionId);
    if (transaction === null) throw new Error('Transaction you wanted to edit, does not exist.');

    // push current values to revisions
    const currentValues: Omit<ITransaction, 'revisions'> = {
      _id: transaction._id.toString(),
      userId: transaction.userId.toString(),
      transactionTimestamp: transaction.transactionTimestamp,
      description: transaction.description,
      from: {
        datatype: transaction.from.datatype,
        addressId: transaction.from.addressId.toString(),
      },
      to: {
        datatype: transaction.to.datatype,
        addressId: transaction.to.addressId.toString(),
      },
      amount: transaction.amount,
      entryTimestamp: transaction.entryTimestamp,
    };
    transaction.revisions.push(currentValues);
    // set values from newTransaction
    transaction.transactionTimestamp = newTransaction.transactionTimestamp;
    transaction.description = newTransaction.description;
    transaction.from = newTransaction.from;
    transaction.to = newTransaction.to;
    transaction.amount = newTransaction.amount;
    transaction.entryTimestamp = newTransaction.entryTimestamp;
    // verify transaction values
    let editedTransaction: ITransaction = {
      _id: transaction._id.toString(),
      userId: transaction.userId.toString(),
      transactionTimestamp: transaction.transactionTimestamp,
      description: transaction.description,
      from: {
        datatype: transaction.from.datatype,
        addressId: transaction.from.addressId.toString(),
      },
      to: {
        datatype: transaction.to.datatype,
        addressId: transaction.to.addressId.toString(),
      },
      amount: transaction.amount,
      entryTimestamp: transaction.entryTimestamp,
      revisions: transaction.revisions,
    };
    editedTransaction = transactionHelpers.runtimeCast(editedTransaction);
    // Save edited transaction into DB
    await transaction.save();
    // return edited transaction
    return editedTransaction;
  },
  delete: async function deleteTransaction(transactionId: string): Promise<boolean> {
    // const transaction = await TransactionModel.findById(transactionId);
    // if (!transaction) throw new Error('Transaction you wanted to delete was not found!');
    try {
      const response = await TransactionModel.findByIdAndDelete(transactionId).lean();
      if (response === null) throw new Error('Transaction you wanted to delete was not found!');
      return true;
    } catch (err) {
      console.log(err);
      throw new Error('Transaction deletion failed!');
    }
  },
  findTranasactionsFrom: async function findTransactionsFrom(
    userId: string,
    transactionAddress: ITransactionAddress,
  ): Promise<ITransaction[]> {
    let validatedTransactionAddress = transactionAddressHelpers.validate(transactionAddress);
    validatedTransactionAddress = transactionAddressHelpers.runtimeCast(transactionAddress);
    const transactions = await TransactionModel.find({
      userId: userId,
      'from.datatype': validatedTransactionAddress.datatype,
      'from.addressId': validatedTransactionAddress.addressId,
    })
      .lean()
      .exec();
    return transactions.map((transaction: any) => {
      const transactionObject: ITransaction = {
        _id: transaction._id.toString(),
        userId: transaction.userId.toString(),
        transactionTimestamp: transaction.transactionTimestamp,
        description: transaction.description,
        from: {
          datatype: transaction.from.datatype,
          addressId: transaction.from.addressId.toString(),
        },
        to: {
          datatype: transaction.to.datatype,
          addressId: transaction.to.addressId.toString(),
        },
        amount: transaction.amount,
        entryTimestamp: transaction.entryTimestamp,
        revisions: transaction.revisions,
      };
      return transactionHelpers.runtimeCast(transactionObject);
    });
  },
};
