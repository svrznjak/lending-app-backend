import TransactionModel from './db/model/TransactionModel.js';
import { transactionHelpers } from './types/transaction/transactionHelpers.js';
import { ITransaction } from './types/transaction/transactionInterface.js';
import { ITransactionAddress } from './types/transactionAddress/transactionAddressInterface.js';
import { transactionAddressHelpers } from './types/transactionAddress/transactionAddressHelpers.js';
import mongoose, { ClientSession } from 'mongoose';
import * as User from './user.js';
import Budget from './budget.js';
import Loan from './loan.js';
import LoanCache from './cache/loanCache.js';
import paranoidCalculator from './utils/paranoidCalculator/paranoidCalculator.js';
import { ILoan } from './types/loan/loanInterface.js';

export default {
  getOne: async function getOneTransaction({ transactionId }: { transactionId: string }): Promise<ITransaction> {
    try {
      const Mongo_transaction: any = await TransactionModel.findById(transactionId).lean();
      if (Mongo_transaction === null) throw new Error('Transaction with searched _id does not exist');
      return transactionHelpers.runtimeCast({
        _id: Mongo_transaction._id.toString(),
        userId: Mongo_transaction.userId.toString(),
        transactionTimestamp: Mongo_transaction.transactionTimestamp,
        description: Mongo_transaction.description,
        from: {
          datatype: Mongo_transaction.from.datatype,
          addressId: Mongo_transaction.from.addressId.toString(),
        },
        to: {
          datatype: Mongo_transaction.to.datatype,
          addressId: Mongo_transaction.to.addressId.toString(),
        },
        amount: Mongo_transaction.amount,
        entryTimestamp: Mongo_transaction.entryTimestamp,
      });
    } catch (err) {
      console.log(err);
      throw new Error('Transaction could not be fetchet from db!');
    }
  },
  add: async function addTransaction(
    transaction: Pick<
      ITransaction,
      'userId' | 'transactionTimestamp' | 'description' | 'from' | 'to' | 'amount' | 'entryTimestamp'
    >,
    {
      session = undefined,
      runChecks = true,
    }: {
      session?: ClientSession;
      runChecks?: boolean;
    } = {},
  ): Promise<ITransaction> {
    transactionHelpers.validate.all(transaction);
    transactionHelpers.sanitize.all(transaction);
    const validatedTransaction = {
      _id: new mongoose.Types.ObjectId().toString(),
      ...transaction,
      revisions: undefined,
    } as ITransaction;
    transactionHelpers.runtimeCast(validatedTransaction);
    if (runChecks) {
      try {
        await this.checkIfTransactionCanExist({ transaction: validatedTransaction }, { session: session });
      } catch (err) {
        console.log(err);
        throw new Error(err);
      }
    }
    try {
      const newTransactionInDB: any = await new TransactionModel(validatedTransaction).save({ session });
      const newTransaction: ITransaction = {
        _id: newTransactionInDB._id.toString(),
        userId: newTransactionInDB.userId.toString(),
        transactionTimestamp: newTransactionInDB.transactionTimestamp,
        description: newTransactionInDB.description,
        from: {
          datatype: newTransactionInDB.from.datatype,
          addressId: newTransactionInDB.from.addressId.toString(),
        },
        to: {
          datatype: newTransactionInDB.to.datatype,
          addressId: newTransactionInDB.to.addressId.toString(),
        },
        amount: newTransactionInDB.amount,
        entryTimestamp: newTransactionInDB.entryTimestamp,
      };
      return transactionHelpers.runtimeCast(newTransaction);
    } catch (err) {
      console.log(err);
      throw new Error('Transaction creation failed!');
    }
  },
  edit: async function editTransaction(
    transactionId: string,
    newTransaction: Pick<ITransaction, 'transactionTimestamp' | 'description' | 'amount' | 'entryTimestamp'>,
  ): Promise<ITransaction> {
    // check if newTransaction values are valid for entry
    transactionHelpers.validate.transactionTimestamp(newTransaction.transactionTimestamp);
    transactionHelpers.validate.description(newTransaction.description);
    transactionHelpers.validate.amount(newTransaction.amount);
    transactionHelpers.validate.entryTimestamp(newTransaction.entryTimestamp);
    transactionHelpers.sanitize.all(newTransaction);
    // get old transaction
    const transaction: any = await TransactionModel.findById(transactionId);
    if (transaction === null) throw new Error('Transaction you wanted to edit, does not exist.');

    transaction.revisions = transactionHelpers.runtimeCast({
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
      revisions: transaction.revisions !== undefined ? transaction.revisions.toObject() : undefined,
    });
    // set values from newTransaction
    transaction.transactionTimestamp = newTransaction.transactionTimestamp;
    transaction.description = newTransaction.description;
    transaction.amount = newTransaction.amount;
    transaction.entryTimestamp = newTransaction.entryTimestamp;

    try {
      await this.checkIfTransactionCanExist({
        transaction: transactionHelpers.runtimeCast({
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
          revisions: transaction.revisions !== undefined ? transaction.revisions.toObject() : undefined,
        }),
        originalTransactionId: transactionId,
      });
    } catch (err) {
      console.log(err);
      throw new Error(err);
    }

    // Save edited transaction into DB
    await transaction.save();

    // Get edited transaction to check if everything is ok
    const Mongo_editedTransaction: any = await TransactionModel.findById(transactionId).lean();
    if (Mongo_editedTransaction.transactionTimestamp !== newTransaction.transactionTimestamp)
      throw new Error('Major error!!!');
    if (Mongo_editedTransaction.description !== newTransaction.description) throw new Error('Major error!!!');
    if (Mongo_editedTransaction.amount !== newTransaction.amount) throw new Error('Major error!!!');
    if (Mongo_editedTransaction.entryTimestamp !== newTransaction.entryTimestamp) throw new Error('Major error!!!');

    // verify transaction values
    const editedTransaction: ITransaction = transactionHelpers.runtimeCast({
      _id: Mongo_editedTransaction._id.toString(),
      userId: Mongo_editedTransaction.userId.toString(),
      transactionTimestamp: Mongo_editedTransaction.transactionTimestamp,
      description: Mongo_editedTransaction.description,
      from: {
        datatype: Mongo_editedTransaction.from.datatype,
        addressId: Mongo_editedTransaction.from.addressId.toString(),
      },
      to: {
        datatype: Mongo_editedTransaction.to.datatype,
        addressId: Mongo_editedTransaction.to.addressId.toString(),
      },
      amount: Mongo_editedTransaction.amount,
      entryTimestamp: Mongo_editedTransaction.entryTimestamp,
      revisions: Mongo_editedTransaction.revisions,
    });
    if (editedTransaction.from.datatype === 'BUDGET') {
      await Budget.recalculateCalculatedValues(editedTransaction.from.addressId);
    }
    if (editedTransaction.to.datatype === 'BUDGET') {
      await Budget.recalculateCalculatedValues(editedTransaction.to.addressId);
    }
    if (editedTransaction.from.datatype === 'LOAN') {
      await Loan.recalculateCalculatedValues(editedTransaction.from.addressId);
    }
    if (editedTransaction.to.datatype === 'LOAN') {
      await Loan.recalculateCalculatedValues(editedTransaction.to.addressId);
    }

    // return edited transaction
    return editedTransaction;
  },
  delete: async function deleteTransaction(transactionId: string): Promise<boolean> {
    // const transaction = await TransactionModel.findById(transactionId);
    // if (!transaction) throw new Error('Transaction you wanted to delete was not found!');
    try {
      const deletedTransaction: ITransaction = await TransactionModel.findByIdAndDelete(transactionId).lean();
      if (deletedTransaction === null) throw new Error('Transaction you wanted to delete was not found!');
      if (deletedTransaction.from.datatype === 'BUDGET') {
        Budget.recalculateCalculatedValues(deletedTransaction.from.addressId.toString());
      }
      if (deletedTransaction.to.datatype === 'BUDGET') {
        Budget.recalculateCalculatedValues(deletedTransaction.to.addressId.toString());
      }
      if (deletedTransaction.from.datatype === 'LOAN') {
        LoanCache.setCachedItem({
          itemId: deletedTransaction.to.addressId,
          value: await Loan.recalculateCalculatedValues(deletedTransaction.from.addressId.toString()),
        });
      }
      if (deletedTransaction.to.datatype === 'LOAN') {
        LoanCache.setCachedItem({
          itemId: deletedTransaction.to.addressId,
          value: await Loan.recalculateCalculatedValues(deletedTransaction.to.addressId.toString()),
        });
      }
      return true;
    } catch (err) {
      console.log(err);
      throw new Error('Transaction deletion failed!');
    }
  },
  findTranasactionsFromAndTo: async function findTransactionsFromAndTo(
    transactionAddress: ITransactionAddress,
    { pageNumber = 0, pageSize = Infinity }: { pageNumber?: number; pageSize?: number },
  ): Promise<ITransaction[]> {
    let validatedTransactionAddress = transactionAddressHelpers.validate.all(transactionAddress);
    validatedTransactionAddress = transactionAddressHelpers.runtimeCast(transactionAddress);

    const transactions = await TransactionModel.find({
      $or: [
        {
          'from.datatype': validatedTransactionAddress.datatype,
          'from.addressId': validatedTransactionAddress.addressId,
        },
        {
          'to.datatype': validatedTransactionAddress.datatype,
          'to.addressId': validatedTransactionAddress.addressId,
        },
      ],
    })
      .sort({ transactionTimestamp: -1 })
      .skip(pageSize * pageNumber)
      .limit(pageSize)
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
  /**
   * Checks if transaction will break any of following rules:
   * - Rule 0: Referenced User, Budget and Loan must exist
   * - Rule 1: Transaction involving the budget can not occur if the budget would reach negative value at any point in
   *   time of existance of the budget
   * - Rule 2: Transaction involving the loan can not occur before the loan is created
   * - Rule 3: Transaction involving the loan can not occur if the loan has status of "closed"
   * @param  {ITransaction} transaction - Transaction that is about to be entered into database.
   * @param  {string|undefined} originalTransactionId - (Used when editing existing transaction) Id of transaction that is being replaced/edited
   * @returns Promise<true> or throws error
   */
  checkIfTransactionCanExist: async function checkIfTransactionCanExist(
    {
      transaction,
      originalTransactionId,
    }: {
      transaction: ITransaction;
      originalTransactionId: string | undefined;
    },
    { session = undefined }: { session?: ClientSession } = {},
  ): Promise<true> {
    // Do check for Rule 0
    await User.checkIfExists(transaction.userId);
    if (transaction.from.datatype === 'BUDGET') await Budget.checkIfExists(transaction.from.addressId, session);
    if (transaction.to.datatype === 'BUDGET') await Budget.checkIfExists(transaction.to.addressId, session);
    if (transaction.from.datatype === 'LOAN') await Loan.checkIfExists(transaction.from.addressId, session);
    if (transaction.to.datatype === 'LOAN') await Loan.checkIfExists(transaction.to.addressId, session);

    // Do check for Rule 1
    if (transaction.from.datatype === 'BUDGET') {
      const AFFECTED_BUDGET_ID = transaction.from.addressId;
      const AFFECTED_BUDGET_TRANSACTIONS: ITransaction[] = await Budget.getTransactions(AFFECTED_BUDGET_ID, {
        pageNumber: 0,
        pageSize: Infinity,
      });

      // delete old transaction from Transactions if originalTransactionId is provided
      if (originalTransactionId !== undefined) {
        for (let i = 0; i < AFFECTED_BUDGET_TRANSACTIONS.length; i++) {
          if (AFFECTED_BUDGET_TRANSACTIONS[i]._id === originalTransactionId) {
            AFFECTED_BUDGET_TRANSACTIONS.splice(i, 1);
            break;
          }
        }
      }

      // insert new transaction into Transactions at correct index (according to transactionTimestamp and entryTimestamp)
      /*
        Algo explained:
        Loop existing transactions from newest to oldest. (newest transaction = o | oldest transaction = transactions.length-1)
        If new transaction is newer than transactions[i] then insert new transaction after transactions[i] and break loop.
        Else if new transaction is equal age as transactions[i] then check for entryTimestamp
        - if entryTimestamp of new transaction is newer or equal then insert new transaction after transactions[i]
        - else insert new transaction before transactions[i]
        If new transaction is not inserted while looping throught transactions 
        (aka. new transaction is older than oldest transaction)
        then insert new transaction at end of transactions array (oldest transaction)
      */
      let isTransactionInserted = false;
      for (let i = 0; i < AFFECTED_BUDGET_TRANSACTIONS.length; i++) {
        if (AFFECTED_BUDGET_TRANSACTIONS[i].transactionTimestamp < transaction.transactionTimestamp) {
          AFFECTED_BUDGET_TRANSACTIONS.splice(i, 0, transaction);
          isTransactionInserted = true;
          break;
        } else if (AFFECTED_BUDGET_TRANSACTIONS[i].transactionTimestamp === transaction.transactionTimestamp) {
          if (AFFECTED_BUDGET_TRANSACTIONS[i].entryTimestamp <= transaction.entryTimestamp) {
            AFFECTED_BUDGET_TRANSACTIONS.splice(i, 0, transaction);
          } else {
            AFFECTED_BUDGET_TRANSACTIONS.splice(i + 1, 0, transaction);
          }
          isTransactionInserted = true;
          break;
        }
      }
      if (!isTransactionInserted) {
        AFFECTED_BUDGET_TRANSACTIONS.splice(AFFECTED_BUDGET_TRANSACTIONS.length - 1, 0, transaction);
      }

      let budgetFunds = 0;
      for (let i = AFFECTED_BUDGET_TRANSACTIONS.length - 1; i >= 0; i--) {
        const TRANSACTION = AFFECTED_BUDGET_TRANSACTIONS[i];

        if (TRANSACTION.from.datatype === 'BUDGET') {
          budgetFunds = paranoidCalculator.subtract(budgetFunds, TRANSACTION.amount);
        } else if (TRANSACTION.to.datatype === 'BUDGET') {
          budgetFunds = paranoidCalculator.add(budgetFunds, TRANSACTION.amount);
        }
        if (budgetFunds < 0) {
          throw new Error(
            'New transaction would make budget funds negative at (timestamp): ' + TRANSACTION.entryTimestamp,
          );
        }
      }
    }

    // Do check for Rule 2 and Rule 3
    if (transaction.from.datatype === 'LOAN') {
      const AFFECTED_LOAN: ILoan = await Loan.getOneFromUser(
        {
          userId: transaction.userId,
          loanId: transaction.from.addressId,
        },
        { session: session },
      );
      if (AFFECTED_LOAN.openedTimestamp > transaction.transactionTimestamp)
        throw new Error('Transaction can not occur before loan openedTimestamp');

      if (AFFECTED_LOAN.status === 'CLOSED') throw new Error('Transaction can not occur on loan with status "CLOSED"');
    } else if (transaction.to.datatype === 'LOAN') {
      const AFFECTED_LOAN: ILoan = await Loan.getOneFromUser(
        {
          userId: transaction.userId,
          loanId: transaction.to.addressId,
        },
        { session: session },
      );
      if (AFFECTED_LOAN.openedTimestamp > transaction.transactionTimestamp)
        throw new Error('Transaction can not occur before loan openedTimestamp');
      if (AFFECTED_LOAN.status === 'CLOSED') throw new Error('Transaction can not occur on loan with status "CLOSED"');
    }
    return true;
  },
};
