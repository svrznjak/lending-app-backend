import { budgetHelpers } from './types/budget/budgetHelpers.js';
import { ITransaction } from './types/transaction/transactionInterface.js';
import UserModel from './db/model/UserModel.js';
import transaction from './transaction.js';
import { IBudget } from './types/budget/budgetInterface.js';
import { interestRateHelpers } from './types/interestRate/interestRateHelpers.js';
import paranoidCalculator from './utils/paranoidCalculator/paranoidCalculator.js';
// As a lender, I want to create a budget, so that I can categorize my investments.

export default {
  create: async function createBudget(
    userId: string,
    budget: Pick<IBudget, 'name' | 'description' | 'defaultInterestRate'>,
  ): Promise<IBudget> {
    try {
      budgetHelpers.validate.all(budget);
      budgetHelpers.sanitize.all(budget);
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
  getTransactions: async function getBudgetTransactions(budgetId: string): Promise<ITransaction[]> {
    return await transaction.findTranasactionsFromAndTo({
      addressId: budgetId,
      datatype: 'BUDGET',
    });
  },
  // As a lender, I want to export budget data and transactions, so that I can archive them or import them to other software.
  export: function joinBudetTransactionsIntoAccountingTable(): void {
    return;
  },
  // As a lender, I want to change the existing budget name and description, so that I can set a more fitting name and description.
  // As a lender, I want to change the default interest rate, so that I can adapt my budget to current market conditions.
  edit: async function editBudgetInfo({
    userId,
    budgetId,
    name,
    description,
    defaultInterestRateType,
    defaultInterestRateDuration,
    defaultInterestRateAmount,
  }: {
    userId: string;
    budgetId: string;
    name?: string;
    description?: string;
    defaultInterestRateType?: string;
    defaultInterestRateDuration?: string;
    defaultInterestRateAmount?: number;
  }): Promise<IBudget> {
    // Get user
    const user = await UserModel.findOne({ _id: userId });
    if (user === null) throw new Error('User does not exist!');
    // Get budget
    const budget: any = await user.budgets.id(budgetId);
    if (budget === null) throw new Error('Budget does not exist!');

    const newInfo: any = {};
    if (name !== undefined) {
      newInfo.name = budgetHelpers.validate.name(name);
      newInfo.name = budgetHelpers.sanitize.name(newInfo.name);
    }
    if (description !== undefined) {
      newInfo.description = budgetHelpers.validate.description(description);
      newInfo.description = budgetHelpers.sanitize.description(newInfo.description);
    }
    // check if defaultInterestRate needs to change
    if (
      defaultInterestRateType !== undefined ||
      defaultInterestRateDuration !== undefined ||
      defaultInterestRateAmount !== undefined
    ) {
      // push current defaultInterestRate into revisions
      newInfo.defaultInterestRate = budget.defaultInterestRate;
      newInfo.defaultInterestRate.revisions = newInfo.defaultInterestRate;
      if (defaultInterestRateType !== undefined)
        newInfo.defaultInterestRate.type = interestRateHelpers.validate.type(defaultInterestRateType);
      if (defaultInterestRateDuration !== undefined)
        newInfo.defaultInterestRate.duration = interestRateHelpers.validate.duration(defaultInterestRateDuration);
      if (defaultInterestRateAmount !== undefined)
        newInfo.defaultInterestRate.amount = interestRateHelpers.validate.amount(defaultInterestRateAmount);
      newInfo.defaultInterestRate.entryTimestamp = interestRateHelpers.validate.entryTimestamp(new Date().getTime());
    }
    budget.set(newInfo);
    const changedBudget = budgetHelpers.runtimeCast({
      _id: budget._id.toString(),
      name: budget.name,
      description: budget.description,
      defaultInterestRate: {
        type: budget.defaultInterestRate.type,
        duration: budget.defaultInterestRate.duration,
        amount: budget.defaultInterestRate.amount,
        entryTimestamp: budget.defaultInterestRate.entryTimestamp,
        revisions: budget.defaultInterestRate.revisions.toObject(),
      },
      calculatedTotalAmount: budget.calculatedTotalAmount,
      calculatedLendedAmount: budget.calculatedLendedAmount,
    });
    await user.save();
    return changedBudget;
  },
  recalculateCalculatedValues: async function recalculateCalculatedBudgetValues(Mongo_budget): Promise<boolean> {
    // Optimizations possible for calculations at scale
    // get all transactions
    const budgetTransactions = await this.getTransactions(Mongo_budget._id.toString());

    // initialize variables
    let newCalculatedTotalAmount = 0;
    let newCalculatedLendedAmount = 0;

    // Loop and add to variables
    budgetTransactions.forEach((transaction) => {
      if (transaction.to.datatype === 'BUDGET' && transaction.from.datatype === 'OUTSIDE') {
        newCalculatedTotalAmount = paranoidCalculator.add(newCalculatedTotalAmount, transaction.amount);
      } else if (transaction.to.datatype === 'OUTSIDE' && transaction.from.datatype === 'BUDGET') {
        newCalculatedTotalAmount = paranoidCalculator.subtract(newCalculatedTotalAmount, transaction.amount);
      } else if (transaction.to.datatype === 'LOAN' && transaction.from.datatype === 'BUDGET') {
        newCalculatedLendedAmount = paranoidCalculator.add(newCalculatedLendedAmount, transaction.amount);
      } else if (transaction.to.datatype === 'BUDGET' && transaction.from.datatype === 'LOAN') {
        newCalculatedLendedAmount = paranoidCalculator.subtract(newCalculatedLendedAmount, transaction.amount);
      }
    });

    // save calculations to DB
    Mongo_budget.calculatedTotalAmount = newCalculatedTotalAmount;
    Mongo_budget.calculatedLendedAmount = newCalculatedLendedAmount;

    // TODO : I think this wont work because budget is subdocument
    Mongo_budget.save();
    return true;
  },
};
