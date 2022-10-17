import TransactionModel from './db/model/TransactionModel.js';
import { transactionHelpers } from './types/transaction/transactionHelpers.js';
import { ITransaction } from './types/transaction/transactionInterface.js';
import { ITransactionAddress } from './types/transactionAddress/transactionAddressInterface.js';
import { transactionAddressHelpers } from './types/transactionAddress/transactionAddressHelpers.js';
import mongoose, { SessionOption } from 'mongoose';
import Budget from './budget.js';
import BudgetModel from './db/model/BudgetModel.js';
import Loan from './loan.js';
import LoanModel from './db/model/LoanModel.js';
import LoanCache from './cache/loanCache.js';

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
    options?,
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
      const newTransactionInDB: any = await new TransactionModel(validatedTransaction).save(options);
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

    transaction.revisions = transaction;
    // set values from newTransaction
    transaction.transactionTimestamp = newTransaction.transactionTimestamp;
    transaction.description = newTransaction.description;
    transaction.amount = newTransaction.amount;
    transaction.entryTimestamp = newTransaction.entryTimestamp;

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
      const Mongo_budget: any = await BudgetModel.findOne({ _id: editedTransaction.from.addressId });
      if (Mongo_budget === null) throw new Error('budget does not exist!');
      await Budget.recalculateCalculatedValues({ Mongo_budget: Mongo_budget });
    }
    if (editedTransaction.to.datatype === 'BUDGET') {
      const Mongo_budget: any = await BudgetModel.findOne({ _id: editedTransaction.to.addressId });
      if (Mongo_budget === null) throw new Error('budget does not exist!');
      await Budget.recalculateCalculatedValues({ Mongo_budget: Mongo_budget });
    }
    if (editedTransaction.from.datatype === 'LOAN') {
      const Mongo_loan: any = await LoanModel.findOne({ _id: editedTransaction.from.addressId });
      if (Mongo_loan === null) throw new Error('loan does not exist!');
      await Loan.recalculateCalculatedValues({ Mongo_loan: Mongo_loan });
    }
    if (editedTransaction.to.datatype === 'LOAN') {
      const Mongo_loan: any = await LoanModel.findOne({ _id: editedTransaction.to.addressId });
      if (Mongo_loan === null) throw new Error('loan does not exist!');
      await Loan.recalculateCalculatedValues({ Mongo_loan: Mongo_loan });
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
        Budget.recalculateCalculatedValues({
          Mongo_budget: await BudgetModel.findOne({
            _id: deletedTransaction.from.addressId,
            userId: deletedTransaction.userId,
          }).exec(),
        });
      }
      if (deletedTransaction.to.datatype === 'BUDGET') {
        Budget.recalculateCalculatedValues({
          Mongo_budget: await BudgetModel.findOne({
            _id: deletedTransaction.to.addressId,
            userId: deletedTransaction.userId,
          }).exec(),
        });
      }
      if (deletedTransaction.from.datatype === 'LOAN') {
        LoanCache.setCachedItem({
          itemId: deletedTransaction.to.addressId,
          value: await Loan.recalculateCalculatedValues({
            Mongo_loan: await LoanModel.findOne({
              _id: deletedTransaction.from.addressId,
              userId: deletedTransaction.userId,
            }).exec(),
          }),
        });
      }
      if (deletedTransaction.to.datatype === 'LOAN') {
        LoanCache.setCachedItem({
          itemId: deletedTransaction.to.addressId,
          value: await Loan.recalculateCalculatedValues({
            Mongo_loan: await LoanModel.findOne({
              _id: deletedTransaction.to.addressId,
              userId: deletedTransaction.userId,
            }).exec(),
          }),
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
  transferAmountFromBudgetToLoan: async function transferAmountFromBudgetToLoan(
    { userId, budgetId, loanId, transactionTimestamp, description, amount, entryTimestamp },
    options?: { session?: SessionOption },
  ): Promise<ITransaction> {
    const newTransaction = await this.add(
      {
        userId,
        transactionTimestamp,
        description,
        from: {
          datatype: 'BUDGET',
          addressId: budgetId,
        },
        to: {
          datatype: 'LOAN',
          addressId: loanId,
        },
        amount,
        entryTimestamp,
      } as Pick<
        ITransaction,
        'userId' | 'transactionTimestamp' | 'description' | 'from' | 'to' | 'amount' | 'entryTimestamp'
      >,
      options,
    );
    return newTransaction;
  },
  transferAmountFromLoanToBudget: async function transferAmountFromLoanToBudget(
    { userId, loanId, budgetId, transactionTimestamp, description, amount, entryTimestamp },
    options?,
  ): Promise<ITransaction> {
    const newTransaction = await this.add(
      {
        userId,
        transactionTimestamp,
        description,
        from: {
          datatype: 'LOAN',
          addressId: loanId,
        },
        to: {
          datatype: 'BUDGET',
          addressId: budgetId,
        },
        amount,
        entryTimestamp,
      } as Pick<
        ITransaction,
        'userId' | 'transactionTimestamp' | 'description' | 'from' | 'to' | 'amount' | 'entryTimestamp'
      >,
      options,
    );
    return newTransaction;
  },
};
