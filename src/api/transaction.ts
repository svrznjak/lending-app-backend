import TransactionModel from './db/model/TransactionModel.js';
import { transactionHelpers } from './types/transaction/transactionHelpers.js';
import { ITransaction } from './types/transaction/transactionInterface.js';
import { ITransactionAddress } from './types/transactionAddress/transactionAddressInterface.js';
import { transactionAddressHelpers } from './types/transactionAddress/transactionAddressHelpers.js';
import mongoose, { ClientSession } from 'mongoose';
import * as User from './user.js';
import Budget from './budget.js';
import Loan from './loan.js';
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
        refund: Mongo_transaction.refund,
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
    try {
      if (runChecks) {
        await this.checkIfTransactionCanExist({ transaction: validatedTransaction }, { session: session });
      }
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
        refund: newTransactionInDB.refund,
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

    if (transaction.from.datatype === 'LOAN') {
      const AFFECTED_LOAN: ILoan = await Loan.getOneFromUser({
        userId: transaction.userId,
        loanId: transaction.from.addressId,
      });

      if (AFFECTED_LOAN.status.current === 'COMPLETED' || AFFECTED_LOAN.status.current === 'DEFAULTED')
        throw new Error('Transaction from loan with status "COMPLETED" or "DEFAULTED" can not be deleted');
    } else if (transaction.to.datatype === 'LOAN') {
      const AFFECTED_LOAN: ILoan = await Loan.getOneFromUser({
        userId: transaction.userId,
        loanId: transaction.to.addressId,
      });

      if (AFFECTED_LOAN.status.current === 'COMPLETED' || AFFECTED_LOAN.status.current === 'DEFAULTED')
        throw new Error('Transaction from loan with status "COMPLETED" or "DEFAULTED" can not be deleted');
    }
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
      refund: transaction.refund,
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
          refund: transaction.refund,
          amount: transaction.amount,
          entryTimestamp: transaction.entryTimestamp,
          revisions: transaction.revisions !== undefined ? transaction.revisions.toObject() : undefined,
        }),
      });
    } catch (err) {
      console.log(err);
      throw new Error(err.message);
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
      refund: Mongo_editedTransaction.refund,
      amount: Mongo_editedTransaction.amount,
      entryTimestamp: Mongo_editedTransaction.entryTimestamp,
      revisions: Mongo_editedTransaction.revisions,
    });
    if (editedTransaction.from.datatype === 'BUDGET') {
      await Budget.updateTransactionList(editedTransaction.from.addressId);
    }
    if (editedTransaction.to.datatype === 'BUDGET') {
      await Budget.updateTransactionList(editedTransaction.to.addressId);
    }
    if (editedTransaction.from.datatype === 'LOAN') {
      const recalculatedLoan = await this.recalculateCalculatedValues(editedTransaction.from.addressId);
      for (const budget of recalculatedLoan.calculatedRelatedBudgets) {
        await Budget.updateTransactionList(budget.budgetId);
      }
    }
    if (editedTransaction.to.datatype === 'LOAN') {
      const recalculatedLoan = await this.recalculateCalculatedValues(editedTransaction.to.addressId);
      for (const budget of recalculatedLoan.calculatedRelatedBudgets) {
        await Budget.updateTransactionList(budget.budgetId);
      }
    }

    // return edited transaction
    return editedTransaction;
  },
  delete: async function deleteTransaction(transactionId: string): Promise<ITransaction> {
    // const transaction = await TransactionModel.findById(transactionId);
    // if (!transaction) throw new Error('Transaction you wanted to delete was not found!');
    try {
      const TRANSACTION = await this.getOne({ transactionId });
      if (TRANSACTION.from.datatype === 'LOAN') {
        const AFFECTED_LOAN: ILoan = await Loan.getOneFromUser({
          userId: TRANSACTION.userId,
          loanId: TRANSACTION.from.addressId,
        });

        if (AFFECTED_LOAN.status.current === 'COMPLETED' || AFFECTED_LOAN.status.current === 'DEFAULTED')
          throw new Error('Transaction from loan with status "COMPLETED" or "DEFAULTED" can not be deleted');
      } else if (TRANSACTION.to.datatype === 'LOAN') {
        const AFFECTED_LOAN: ILoan = await Loan.getOneFromUser({
          userId: TRANSACTION.userId,
          loanId: TRANSACTION.to.addressId,
        });

        if (AFFECTED_LOAN.status.current === 'COMPLETED' || AFFECTED_LOAN.status.current === 'DEFAULTED')
          throw new Error('Transaction from loan with status "COMPLETED" or "DEFAULTED" can not be deleted');
      }
      const deletedTransaction: ITransaction = await TransactionModel.findByIdAndDelete(transactionId).lean();
      if (deletedTransaction === null) throw new Error('Transaction you wanted to delete was not found!');
      if (deletedTransaction.from.datatype === 'BUDGET') {
        Budget.updateTransactionList(deletedTransaction.from.addressId.toString());
      }
      if (deletedTransaction.to.datatype === 'BUDGET') {
        Budget.updateTransactionList(deletedTransaction.to.addressId.toString());
      }
      if (deletedTransaction.from.datatype === 'LOAN') {
        await Loan.recalculateCalculatedValues(deletedTransaction.from.addressId.toString());
      }
      if (deletedTransaction.to.datatype === 'LOAN') {
        await Loan.recalculateCalculatedValues(deletedTransaction.to.addressId.toString());
      }
      return deletedTransaction;
    } catch (err) {
      console.log(err);
      throw new Error('Transaction deletion failed!');
    }
  },
  findTranasactionsFromAndTo: async function findTransactionsFromAndTo(
    transactionAddress: ITransactionAddress,
    { pageNumber = 0, pageSize = Infinity }: { pageNumber?: number; pageSize?: number },
    { session = undefined }: { session?: ClientSession } = {},
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
      .session(session)
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
        refund: transaction.refund,
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
   * - (Deprecated) Rule 1: Transaction involving the budget can not occur if the budget would reach negative value at any point in
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
    }: {
      transaction: ITransaction;
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
    /* Deprecated because there is currently no need to perform this check
    if (transaction.from.datatype === 'BUDGET') {
      if (originalTransactionId !== undefined)
        throw new Error('TODO: Editing transaction linked to budget in not implemented!');
      const AFFECTED_BUDGET = await Budget.getOneFromUserWithTransactionList(
        {
          userId: transaction.userId,
          budgetId: transaction.from.addressId,
        },
        { session: session },
      );

      let avaiableFunds = Infinity;
      //for (let i = budget.transactionList.length - 1; i >= 0; i--) {
      for (let i = 0; i < AFFECTED_BUDGET.transactionList.length; i++) {
        const budgetTransaction = AFFECTED_BUDGET.transactionList[i];
        if (avaiableFunds > budgetTransaction.budgetStats.totalAvailableAmount)
          avaiableFunds = budgetTransaction.budgetStats.totalAvailableAmount;
        if (budgetTransaction.timestamp < transaction.transactionTimestamp) break;
      }
      if (avaiableFunds < transaction.amount) throw new Error('transaction would make budget funds negative');
    }
    */
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

      if (AFFECTED_LOAN.status.current === 'COMPLETED')
        throw new Error('Transaction can not occur on loan with status "COMPLETED"');
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
      if (AFFECTED_LOAN.status.current === 'COMPLETED')
        throw new Error('Transaction can not occur on loan with status "COMPLETED"');
    }
    return true;
  },
};
