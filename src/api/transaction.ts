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
        interestRate: Mongo_transaction.interestRate,
        relatedBudgetId: Mongo_transaction.relatedBudgetId,
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
      | 'userId'
      | 'transactionTimestamp'
      | 'description'
      | 'from'
      | 'to'
      | 'interestRate'
      | 'relatedBudgetId'
      | 'amount'
      | 'entryTimestamp'
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

      // in case where session is not defined it is needed just to test run loan.recalculateCaluclatedValues and budget.updateTransactionList
      if (session === undefined) {
        const session: ClientSession = await mongoose.connection.startSession();
        try {
          session.startTransaction();
          const newTransactionInDB: any = await new TransactionModel(validatedTransaction).save({ session });

          if (newTransactionInDB.from.datatype === 'LOAN') {
            const recalculatedLoan: ILoan = await Loan.recalculateCalculatedValues(
              newTransactionInDB.from.addressId.toString(),
              session,
            );
            for (const budget of recalculatedLoan.calculatedRelatedBudgets) {
              await Budget.updateTransactionList(budget.budgetId, session);
            }
          } else if (newTransactionInDB.to.datatype === 'LOAN') {
            const recalculatedLoan: ILoan = await Loan.recalculateCalculatedValues(
              newTransactionInDB.to.addressId.toString(),
              session,
            );
            for (const budget of recalculatedLoan.calculatedRelatedBudgets) {
              await Budget.updateTransactionList(budget.budgetId, session);
            }
          } else if (newTransactionInDB.from.datatype === 'BUDGET') {
            await Budget.updateTransactionList(newTransactionInDB.from.addressId.toString(), session);
          } else if (newTransactionInDB.to.datatype === 'BUDGET') {
            await Budget.updateTransactionList(newTransactionInDB.to.addressId.toString(), session);
          }
          await session.commitTransaction();
          return transactionHelpers.runtimeCast({
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
            interestRate: newTransactionInDB.interestRate,
            relatedBudgetId: newTransactionInDB.relatedBudgetId,
            amount: newTransactionInDB.amount,
            entryTimestamp: newTransactionInDB.entryTimestamp,
          });
        } catch (err) {
          await session.abortTransaction();
          throw err;
        } finally {
          session.endSession();
        }
      } else {
        const newTransactionInDB: any = await new TransactionModel(validatedTransaction).save({ session });
        return transactionHelpers.runtimeCast({
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
          interestRate: newTransactionInDB.interestRate,
          relatedBudgetId: newTransactionInDB.relatedBudgetId,
          amount: newTransactionInDB.amount,
          entryTimestamp: newTransactionInDB.entryTimestamp,
        });
      }
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

    if (transaction.from.datatype === 'BUDGET' && transaction.to.datatype === 'LOAN') {
      throw new Error('Transaction from budget to loan can not be edited');
    }

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
      interestRate: transaction.interestRate,
      relatedBudgetId: transaction.relatedBudgetId,
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
          interestRate: transaction.interestRate,
          relatedBudgetId: transaction.relatedBudgetId,
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
    /*
      use session and perform loan.recalculateCalculatedValues() and budget.updateTransactionList() after save.
      This causes save to fail is any inconsistency is found during recalculation of loan and budget (for example budget reaches negative value).
    */
    const session: ClientSession = await mongoose.connection.startSession();
    try {
      session.startTransaction();
      transaction.save({ session });
      if (transaction.from.datatype === 'BUDGET') {
        await Budget.updateTransactionList(transaction.from.addressId.toString(), session);
      }
      if (transaction.to.datatype === 'BUDGET') {
        await Budget.updateTransactionList(transaction.to.addressId.toString(), session);
      }
      if (transaction.from.datatype === 'LOAN') {
        const recalculatedLoan: ILoan = await Loan.recalculateCalculatedValues(
          transaction.from.addressId.toString(),
          session,
        );
        for (const budget of recalculatedLoan.calculatedRelatedBudgets) {
          await Budget.updateTransactionList(budget.budgetId, session);
        }
      }
      if (transaction.to.datatype === 'LOAN') {
        const recalculatedLoan: ILoan = await Loan.recalculateCalculatedValues(
          transaction.to.addressId.toString(),
          session,
        );
        for (const budget of recalculatedLoan.calculatedRelatedBudgets) {
          await Budget.updateTransactionList(budget.budgetId, session);
        }
      }
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    // verify transaction values
    const editedTransaction: ITransaction = transactionHelpers.runtimeCast({
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
      interestRate: transaction.interestRate,
      relatedBudgetId: transaction.relatedBudgetId,
      amount: transaction.amount,
      entryTimestamp: transaction.entryTimestamp,
      revisions: transaction.revisions !== undefined ? transaction.revisions.toObject() : undefined,
    });
    if (editedTransaction.from.datatype === 'BUDGET') {
      await Budget.updateTransactionList(editedTransaction.from.addressId.toString());
    }
    if (editedTransaction.to.datatype === 'BUDGET') {
      await Budget.updateTransactionList(editedTransaction.to.addressId.toString());
    }
    if (editedTransaction.from.datatype === 'LOAN') {
      const recalculatedLoan = await Loan.recalculateCalculatedValues(editedTransaction.from.addressId.toString());
      for (const budget of recalculatedLoan.calculatedRelatedBudgets) {
        await Budget.updateTransactionList(budget.budgetId);
      }
    }
    if (editedTransaction.to.datatype === 'LOAN') {
      const recalculatedLoan = await Loan.recalculateCalculatedValues(editedTransaction.to.addressId.toString());
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
    const transaction: any = await TransactionModel.findById(transactionId);
    if (transaction === null) throw new Error('Transaction you wanted to edit, does not exist.');

    if (transaction.from.datatype === 'BUDGET' && transaction.to.datatype === 'LOAN') {
      throw new Error('Transaction from budget to loan can not be deleted');
    }
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
    // Save edited transaction into DB
    /*
      use session and perform loan.recalculateCalculatedValues() and budget.updateTransactionList() after save.
      This causes save to fail is any inconsistency is found during recalculation of loan and budget (for example budget reaches negative value).
    */
    const session: ClientSession = await mongoose.connection.startSession();
    try {
      session.startTransaction();
      const deletedTransaction: ITransaction = await TransactionModel.findByIdAndDelete(transactionId)
        .session(session)
        .lean();
      if (deletedTransaction === null) throw new Error('Transaction you wanted to delete was not found!');
      //transaction.remove({ session });
      if (deletedTransaction.from.datatype === 'BUDGET') {
        await Budget.updateTransactionList(deletedTransaction.from.addressId.toString(), session);
      }
      if (deletedTransaction.to.datatype === 'BUDGET') {
        await Budget.updateTransactionList(deletedTransaction.to.addressId.toString(), session);
      }
      if (deletedTransaction.from.datatype === 'LOAN') {
        const recalculatedLoan: ILoan = await Loan.recalculateCalculatedValues(
          deletedTransaction.from.addressId.toString(),
          session,
        );
        for (const budget of recalculatedLoan.calculatedRelatedBudgets) {
          await Budget.updateTransactionList(budget.budgetId, session);
        }
      }
      if (deletedTransaction.to.datatype === 'LOAN') {
        const recalculatedLoan: ILoan = await Loan.recalculateCalculatedValues(
          deletedTransaction.to.addressId.toString(),
          session,
        );
        for (const budget of recalculatedLoan.calculatedRelatedBudgets) {
          await Budget.updateTransactionList(budget.budgetId, session);
        }
      }
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
    // verify transaction values
    const deletedTransaction: ITransaction = transactionHelpers.runtimeCast({
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
      interestRate: transaction.interestRate,
      relatedBudgetId: transaction.relatedBudgetId,
      amount: transaction.amount,
      entryTimestamp: transaction.entryTimestamp,
      revisions: transaction.revisions !== undefined ? transaction.revisions.toObject() : undefined,
    });
    if (deletedTransaction.from.datatype === 'BUDGET') {
      Budget.updateTransactionList(deletedTransaction.from.addressId);
    }
    if (deletedTransaction.to.datatype === 'BUDGET') {
      Budget.updateTransactionList(deletedTransaction.to.addressId);
    }
    if (deletedTransaction.from.datatype === 'LOAN') {
      await Loan.recalculateCalculatedValues(deletedTransaction.from.addressId);
    }
    if (deletedTransaction.to.datatype === 'LOAN') {
      await Loan.recalculateCalculatedValues(deletedTransaction.to.addressId);
    }
    return deletedTransaction;
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
        interestRate: transaction.interestRate,
        relatedBudgetId: transaction.relatedBudgetId,
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
