import { ITransaction } from './types/transaction/transactionInterface.js';
import UserModel from './db/model/UserModel.js';
import transaction from './transaction.js';
import { IBudget } from './types/budget/budgetInterface.js';
import { IUser } from './types/user/userInterface.js';
// As a lender, I want to create a budget, so that I can categorize my investments.

export default {
  create: async function createBudget(
    userId: Pick<IUser, '_id'>,
    budget: Omit<IBudget, '_id, calculatedTotalAmount, calculatedLendedAmount'>,
  ): Promise<IBudget> {
    try {
      const userFromDB = await UserModel.findOne({ _id: userId });
      userFromDB.budgets.push(budget);
      await userFromDB.save();
      const newBudget = userFromDB.budgets[userFromDB.budgets.length - 1];
      return newBudget.toObject();
    } catch (err) {
      console.log(err);
      throw new Error('Budget creation failed!');
    }
  },
  // As a lender, I want to view a list of budgets with basic information, so that I can have a general overview of my investments.
  get: function getBudgets(): void {
    throw new Error('Not implemented. User getUserById to obtain budgets.');
    return;
  },
  // As a lender, I want to add funds to the budget, so that I can later assign them to loans.
  addAmountFromOutside: async function addAmountToBudgetFromOutside({
    userId,
    budgetId,
    transactionTimestamp,
    description,
    amount,
  }: {
    userId: string;
    budgetId: string;
    transactionTimestamp: number;
    description: string;
    amount: number;
  }): Promise<ITransaction> {
    const newTransaction: Pick<
      ITransaction,
      'userId' | 'transactionTimestamp' | 'description' | 'from' | 'to' | 'amount' | 'entryTimestamp'
    > = {
      userId: userId,
      transactionTimestamp: transactionTimestamp,
      description: description,
      from: {
        datatype: 'OUTSIDE',
        addressId: '000000000000000000000000',
      },
      to: {
        datatype: 'BUDGET',
        addressId: budgetId,
      },
      amount: amount,
      entryTimestamp: new Date().getTime(),
    };
    return await transaction.add(newTransaction);
  },

  // As a lender, I want to withdraw funds from the budget, so that I can make use of interest or move it to another budget.
  withdrawAmountToOutside: async function withdrawAmountFromBudgetToOutside({
    userId,
    budgetId,
    transactionTimestamp,
    description,
    amount,
  }: {
    userId: string;
    budgetId: string;
    transactionTimestamp: number;
    description: string;
    amount: number;
  }): Promise<ITransaction> {
    const newTransaction: Pick<
      ITransaction,
      'userId' | 'transactionTimestamp' | 'description' | 'from' | 'to' | 'amount' | 'entryTimestamp'
    > = {
      userId: userId,
      transactionTimestamp: transactionTimestamp,
      description: description,
      from: {
        datatype: 'BUDGET',
        addressId: budgetId,
      },
      to: {
        datatype: 'OUTSIDE',
        addressId: '000000000000000000000000',
      },
      amount: amount,
      entryTimestamp: new Date().getTime(),
    };
    return await transaction.add(newTransaction);
  },
  // As a lender, I want to view transactions related to budget, so that I can make decisions.
  getTransactions: async function getBudgetTransactions(): Promise<ITransaction[]> {
    return await transaction.findTranasactionsFromAndTo({
      addressId: '6319700ccac59dc8fdc9de05',
      datatype: 'BUDGET',
    });
  },
  // As a lender, I want to export budget data and transactions, so that I can archive them or import them to other software.
  export: function joinBudetTransactionsIntoAccountingTable(): void {
    return;
  },
  // As a lender, I want to change the existing budget name and description, so that I can set a more fitting name and description.
  // As a lender, I want to change the default interest rate, so that I can adapt my budget to current market conditions.
  edit: function editBudgetInfo(): void {
    return;
  },
};
