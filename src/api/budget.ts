import { transactionHelpers } from './types/transaction/transactionHelpers.js';
import mongoose from 'mongoose';
import { budgetHelpers } from './types/budget/budgetHelpers.js';
import { ITransaction } from './types/transaction/transactionInterface.js';
import UserModel from './db/model/UserModel.js';
import transaction from './transaction.js';
import { IBudget } from './types/budget/budgetInterface.js';
import { interestRateHelpers } from './types/interestRate/interestRateHelpers.js';
import paranoidCalculator from './utils/paranoidCalculator/paranoidCalculator.js';
import BudgetModel from './db/model/BudgetModel.js';

export default {
  // As a lender, I want to create a budget, so that I can categorize my investments.
  create: async function createBudget(
    userId: string,
    input: Pick<IBudget, 'name' | 'description' | 'defaultInterestRate'>,
    inititalTransactionAmount: number,
    initialTransactionDescription: string,
  ): Promise<IBudget> {
    // do check on inputs
    budgetHelpers.validate.all(input);
    budgetHelpers.sanitize.all(input);

    // Get user and check if user even exists
    const user: any = await UserModel.findOne({ _id: userId });
    if (user === null) throw new Error('User with provided userId was not found!');

    const budget: IBudget = budgetHelpers.runtimeCast({
      _id: new mongoose.Types.ObjectId().toString(),
      userId: userId,
      name: input.name,
      description: input.description,
      defaultInterestRate: input.defaultInterestRate,
      calculatedTotalWithdrawnAmount: 0,
      calculatedTotalInvestedAmount: inititalTransactionAmount,
      calculatedTotalAvailableAmount: 0,
      isArchived: false,
    });

    const session = await global.mongooseConnection.startSession();
    try {
      session.startTransaction();

      // create budget in db
      const newBudget: any = await new BudgetModel(budget).save({ session });

      // add initial transaction if added
      if (inititalTransactionAmount !== 0) {
        await this.addFundsFromOutside(
          {
            userId: userId,
            budgetId: newBudget._id.toString(),
            transactionTimestamp: transactionHelpers.validate.transactionTimestamp(new Date().getTime()),
            description: initialTransactionDescription,
            amount: inititalTransactionAmount,
          },
          { session },
        );
      }

      await session.commitTransaction();

      // return casted budget
      return budgetHelpers.runtimeCast({
        _id: newBudget._id.toString(),
        userId: newBudget.userId.toString(),
        name: newBudget.name,
        description: newBudget.description,
        defaultInterestRate: {
          type: newBudget.defaultInterestRate.type,
          duration: newBudget.defaultInterestRate.duration,
          expectedPayments: newBudget.defaultInterestRate.expectedPayments,
          amount: newBudget.defaultInterestRate.amount,
          isCompounding: newBudget.defaultInterestRate.isCompounding,
          entryTimestamp: newBudget.defaultInterestRate.entryTimestamp,
          revisions:
            newBudget.defaultInterestRate.revisions !== undefined
              ? {
                  type: newBudget.defaultInterestRate.revisions.type,
                  duration: newBudget.defaultInterestRate.revisions.duration,
                  expectedPayments: newBudget.defaultInterestRate.revisions.expectedPayments,
                  amount: newBudget.defaultInterestRate.revisions.amount,
                  isCompounding: newBudget.defaultInterestRate.revisions.isCompounding,
                  entryTimestamp: newBudget.defaultInterestRate.revisions.entryTimestamp,
                  revisions: newBudget.defaultInterestRate.revisions.revisions,
                }
              : undefined,
        },
        calculatedTotalWithdrawnAmount: newBudget.calculatedTotalWithdrawnAmount,
        calculatedTotalInvestedAmount: newBudget.calculatedTotalInvestedAmount,
        calculatedTotalAvailableAmount: newBudget.calculatedTotalAvailableAmount,
        isArchived: newBudget.isArchived,
      });
    } catch (err) {
      console.log(err);
      await session.abortTransaction();
      throw new Error('Budget creation failed!');
    } finally {
      session.endSession();
    }
  },
  getOneFromUser: async function getBudget({
    userId,
    budgetId,
  }: {
    userId: string;
    budgetId: string;
  }): Promise<IBudget> {
    const Mongo_budget: any = await BudgetModel.findOne({ _id: budgetId, userId: userId }).lean().exec();
    if (Mongo_budget === null) throw new Error('Budget could not be found');
    return budgetHelpers.runtimeCast({
      _id: Mongo_budget._id.toString(),
      userId: Mongo_budget.userId.toString(),
      name: Mongo_budget.name,
      description: Mongo_budget.description,
      defaultInterestRate: {
        type: Mongo_budget.defaultInterestRate.type,
        duration: Mongo_budget.defaultInterestRate.duration,
        expectedPayments: Mongo_budget.defaultInterestRate.expectedPayments,
        amount: Mongo_budget.defaultInterestRate.amount,
        isCompounding: Mongo_budget.defaultInterestRate.isCompounding,
        entryTimestamp: Mongo_budget.defaultInterestRate.entryTimestamp,
        revisions:
          Mongo_budget.defaultInterestRate.revisions !== undefined
            ? {
                type: Mongo_budget.defaultInterestRate.revisions.type,
                duration: Mongo_budget.defaultInterestRate.revisions.duration,
                expectedPayments: Mongo_budget.defaultInterestRate.revisions.expectedPayments,
                amount: Mongo_budget.defaultInterestRate.revisions.amount,
                isCompounding: Mongo_budget.defaultInterestRate.revisions.isCompounding,
                entryTimestamp: Mongo_budget.defaultInterestRate.revisions.entryTimestamp,
                revisions: Mongo_budget.defaultInterestRate.revisions.revisions,
              }
            : undefined,
      },
      calculatedTotalWithdrawnAmount: Mongo_budget.calculatedTotalWithdrawnAmount,
      calculatedTotalInvestedAmount: Mongo_budget.calculatedTotalInvestedAmount,
      calculatedTotalAvailableAmount: Mongo_budget.calculatedTotalAvailableAmount,
      isArchived: Mongo_budget.isArchived,
    });
  },
  // As a lender, I want to view a list of budgets with basic information, so that I can have a general overview of my investments.
  getAllFromUser: async function getBudgets({ userId }: { userId: string }): Promise<IBudget[]> {
    const Mongo_budgets: any = await BudgetModel.find({ userId: userId }).lean().exec();

    return Mongo_budgets.map((Mongo_budget) => {
      return budgetHelpers.runtimeCast({
        _id: Mongo_budget._id.toString(),
        userId: Mongo_budget.userId.toString(),
        name: Mongo_budget.name,
        description: Mongo_budget.description,
        defaultInterestRate: {
          type: Mongo_budget.defaultInterestRate.type,
          duration: Mongo_budget.defaultInterestRate.duration,
          expectedPayments: Mongo_budget.defaultInterestRate.expectedPayments,
          amount: Mongo_budget.defaultInterestRate.amount,
          isCompounding: Mongo_budget.defaultInterestRate.isCompounding,
          entryTimestamp: Mongo_budget.defaultInterestRate.entryTimestamp,
          revisions:
            Mongo_budget.defaultInterestRate.revisions !== undefined
              ? {
                  type: Mongo_budget.defaultInterestRate.revisions.type,
                  duration: Mongo_budget.defaultInterestRate.revisions.duration,
                  expectedPayments: Mongo_budget.defaultInterestRate.revisions.expectedPayments,
                  amount: Mongo_budget.defaultInterestRate.revisions.amount,
                  isCompounding: Mongo_budget.defaultInterestRate.revisions.isCompounding,
                  entryTimestamp: Mongo_budget.defaultInterestRate.revisions.entryTimestamp,
                  revisions: Mongo_budget.defaultInterestRate.revisions.revisions,
                }
              : undefined,
        },
        calculatedTotalWithdrawnAmount: Mongo_budget.calculatedTotalWithdrawnAmount,
        calculatedTotalInvestedAmount: Mongo_budget.calculatedTotalInvestedAmount,
        calculatedTotalAvailableAmount: Mongo_budget.calculatedTotalAvailableAmount,
        isArchived: Mongo_budget.isArchived,
      });
    });
  },
  // As a lender, I want to add funds to the budget, so that I can later assign them to loans.
  addFundsFromOutside: async function addFundsToBudgetFromOutside(
    {
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
    },
    options?,
  ): Promise<ITransaction> {
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
    const createdTransaction = await transaction.add(newTransaction, options);
    await this.recalculateCalculatedValues({
      Mongo_budget: await BudgetModel.findOne({ _id: budgetId, userId: userId }),
    });
    return createdTransaction;
  },

  // As a lender, I want to withdraw funds from the budget, so that I can make use of interest or move it to another budget.
  withdrawFundsToOutside: async function withdrawFundsFromBudgetToOutside(
    {
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
    },
    options?,
  ): Promise<ITransaction> {
    // Get user
    const user = await UserModel.findOne({ _id: userId });
    if (user === null) throw new Error('User does not exist!');
    // Get budget
    const budget: any = await BudgetModel.findOne({ _id: budgetId });
    if (budget === null) throw new Error('Budget does not exist!');

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
    const createdTransaction = await transaction.add(newTransaction, options);
    await this.recalculateCalculatedValues({
      Mongo_budget: await BudgetModel.findOne({ _id: budgetId, userId: userId }),
    });
    return createdTransaction;
  },
  // As a lender, I want to view transactions related to budget, so that I can make decisions.
  getTransactions: async function getBudgetTransactions(
    budgetId: string,
    paginate: { pageNumber: number; pageSize: number },
  ): Promise<ITransaction[]> {
    return await transaction.findTranasactionsFromAndTo(
      {
        addressId: budgetId,
        datatype: 'BUDGET',
      },
      paginate,
    );
  },
  // As a lender, I want to export budget data and transactions, so that I can archive them or import them to other software.
  export: function joinBudetTransactionsIntoAccountingTable(): void {
    return;
  },

  setIsArchived: async function setBudgetIsArchived({
    budgetId,
    isArchived,
  }: {
    budgetId: string;
    isArchived: boolean;
  }): Promise<IBudget> {
    // get budget and check if it exists
    const budget: any = await BudgetModel.findOne({ _id: budgetId });
    if (budget === null) throw new Error('Budget does not exist!');

    budget.isArchived = isArchived;
    const changedBudget = budgetHelpers.runtimeCast({
      _id: budget._id.toString(),
      userId: budget.userId.toString(),
      name: budget.name,
      description: budget.description,
      defaultInterestRate: {
        type: budget.defaultInterestRate.type,
        duration: budget.defaultInterestRate.duration,
        expectedPayments: budget.defaultInterestRate.expectedPayments,
        amount: budget.defaultInterestRate.amount,
        isCompounding: budget.defaultInterestRate.isCompounding,
        entryTimestamp: budget.defaultInterestRate.entryTimestamp,
        revisions:
          budget.defaultInterestRate.revisions !== undefined
            ? {
                type: budget.defaultInterestRate.revisions.type,
                duration: budget.defaultInterestRate.revisions.duration,
                expectedPayments: budget.defaultInterestRate.revisions.expectedPayments,
                amount: budget.defaultInterestRate.revisions.amount,
                isCompounding: budget.defaultInterestRate.revisions.isCompounding,
                entryTimestamp: budget.defaultInterestRate.revisions.entryTimestamp,
                revisions: budget.defaultInterestRate.revisions.revisions,
              }
            : undefined,
      },
      calculatedTotalInvestedAmount: budget.calculatedTotalInvestedAmount,
      calculatedTotalWithdrawnAmount: budget.calculatedTotalWithdrawnAmount,
      calculatedTotalAvailableAmount: budget.calculatedTotalAvailableAmount,
      isArchived: budget.isArchived,
    });
    await budget.save();
    return changedBudget;
  },

  // As a lender, I want to change the existing budget name and description, so that I can set a more fitting name and description.
  // As a lender, I want to change the default interest rate, so that I can adapt my budget to current market conditions.
  edit: async function editBudgetInfo({
    budgetId,
    name,
    description,
    defaultInterestRateType,
    defaultInterestRateDuration,
    defaultInterestRateExpectedPayments,
    defaultInterestRateAmount,
    defaultInterestRateIsCompounding,
    isArchived,
  }: {
    budgetId: string;
    name?: string;
    description?: string;
    defaultInterestRateType?: string;
    defaultInterestRateDuration?: string;
    defaultInterestRateExpectedPayments?: string;
    defaultInterestRateAmount?: number;
    defaultInterestRateIsCompounding?: number;
    isArchived?: boolean;
  }): Promise<IBudget> {
    // Get budget
    const budget: any = await BudgetModel.findOne({ _id: budgetId });
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
    if (isArchived !== undefined) newInfo.isArchived = isArchived;
    // check if defaultInterestRate needs to change
    if (
      defaultInterestRateType !== undefined ||
      defaultInterestRateDuration !== undefined ||
      defaultInterestRateExpectedPayments !== undefined ||
      defaultInterestRateAmount !== undefined ||
      defaultInterestRateIsCompounding !== undefined
    ) {
      // push current defaultInterestRate into revisions
      newInfo.defaultInterestRate = budget.defaultInterestRate;
      newInfo.defaultInterestRate.revisions = {
        type: newInfo.defaultInterestRate.type,
        duration: newInfo.defaultInterestRate.duration,
        expectedPayments: newInfo.defaultInterestRate.expectedPayments,
        amount: newInfo.defaultInterestRate.amount,
        isCompounding: newInfo.defaultInterestRate.isCompounding,
        entryTimestamp: newInfo.defaultInterestRate.entryTimestamp,
      };
      if (defaultInterestRateType !== undefined)
        newInfo.defaultInterestRate.type = interestRateHelpers.validate.type(defaultInterestRateType);
      if (defaultInterestRateDuration !== undefined)
        newInfo.defaultInterestRate.duration = interestRateHelpers.validate.duration(defaultInterestRateDuration);
      if (defaultInterestRateExpectedPayments !== undefined)
        newInfo.defaultInterestRate.expectedPayments = interestRateHelpers.validate.expectedPayments(
          defaultInterestRateExpectedPayments,
        );
      if (defaultInterestRateAmount !== undefined)
        newInfo.defaultInterestRate.amount = interestRateHelpers.validate.amount(defaultInterestRateAmount);
      if (defaultInterestRateIsCompounding !== undefined)
        newInfo.defaultInterestRate.isCompounding = defaultInterestRateIsCompounding;
      newInfo.defaultInterestRate.entryTimestamp = interestRateHelpers.validate.entryTimestamp(new Date().getTime());
    }
    budget.set(newInfo);
    const changedBudget = budgetHelpers.runtimeCast({
      _id: budget._id.toString(),
      userId: budget.userId.toString(),
      name: budget.name,
      description: budget.description,
      defaultInterestRate: {
        type: budget.defaultInterestRate.type,
        duration: budget.defaultInterestRate.duration,
        expectedPayments: budget.defaultInterestRate.expectedPayments,
        amount: budget.defaultInterestRate.amount,
        isCompounding: budget.defaultInterestRate.isCompounding,
        entryTimestamp: budget.defaultInterestRate.entryTimestamp,
        revisions:
          budget.defaultInterestRate.revisions !== undefined
            ? {
                type: budget.defaultInterestRate.revisions.type,
                duration: budget.defaultInterestRate.revisions.duration,
                expectedPayments: budget.defaultInterestRate.revisions.expectedPayments,
                amount: budget.defaultInterestRate.revisions.amount,
                isCompounding: budget.defaultInterestRate.revisions.isCompounding,
                entryTimestamp: budget.defaultInterestRate.revisions.entryTimestamp,
                revisions: budget.defaultInterestRate.revisions.revisions,
              }
            : undefined,
      },
      calculatedTotalInvestedAmount: budget.calculatedTotalInvestedAmount,
      calculatedTotalWithdrawnAmount: budget.calculatedTotalWithdrawnAmount,
      calculatedTotalAvailableAmount: budget.calculatedTotalAvailableAmount,
      isArchived: budget.isArchived,
    });
    await budget.save();
    return changedBudget;
  },
  recalculateCalculatedValues: async function recalculateCalculatedBudgetValues({
    Mongo_budget,
  }: {
    Mongo_budget: any;
  }): Promise<IBudget> {
    // Optimizations possible for calculations at scale

    // get all transactions
    const budgetTransactions = await this.getTransactions(Mongo_budget._id.toString(), {
      pageNumber: 0,
      pageSize: Infinity,
    });

    // initialize variables
    let newCalculatedTotalInvestedAmount = 0;
    let newCalculatedTotalWithdrawnAmount = 0;
    let newCalculatedTotalAvailableAmount = 0;

    // Loop and add to variables
    budgetTransactions.forEach((transaction) => {
      if (transaction.to.datatype === 'BUDGET' && transaction.from.datatype === 'OUTSIDE') {
        newCalculatedTotalInvestedAmount = paranoidCalculator.add(newCalculatedTotalInvestedAmount, transaction.amount);
      } else if (transaction.to.datatype === 'OUTSIDE' && transaction.from.datatype === 'BUDGET') {
        newCalculatedTotalWithdrawnAmount = paranoidCalculator.add(
          newCalculatedTotalWithdrawnAmount,
          transaction.amount,
        );
      } else if (transaction.to.datatype === 'LOAN' && transaction.from.datatype === 'BUDGET') {
        newCalculatedTotalAvailableAmount = paranoidCalculator.add(
          newCalculatedTotalAvailableAmount,
          transaction.amount,
        );
      } else if (transaction.to.datatype === 'BUDGET' && transaction.from.datatype === 'LOAN') {
        newCalculatedTotalAvailableAmount = paranoidCalculator.subtract(
          newCalculatedTotalAvailableAmount,
          transaction.amount,
        );
      }
    });

    // save calculations to DB
    Mongo_budget.calculatedTotalInvestedAmount = newCalculatedTotalInvestedAmount;
    Mongo_budget.calculatedTotalWithdrawnAmount = newCalculatedTotalWithdrawnAmount;
    Mongo_budget.calculatedTotalAvailableAmount =
      newCalculatedTotalInvestedAmount - newCalculatedTotalWithdrawnAmount - newCalculatedTotalAvailableAmount;

    await Mongo_budget.save();
    return budgetHelpers.runtimeCast({
      _id: Mongo_budget._id.toString(),
      userId: Mongo_budget.userId.toString(),
      name: Mongo_budget.name,
      description: Mongo_budget.description,
      defaultInterestRate: {
        type: Mongo_budget.defaultInterestRate.type,
        duration: Mongo_budget.defaultInterestRate.duration,
        expectedPayments: Mongo_budget.defaultInterestRate.expectedPayments,
        amount: Mongo_budget.defaultInterestRate.amount,
        isCompounding: Mongo_budget.defaultInterestRate.isCompounding,
        entryTimestamp: Mongo_budget.defaultInterestRate.entryTimestamp,
        revisions:
          Mongo_budget.defaultInterestRate.revisions !== undefined
            ? {
                type: Mongo_budget.defaultInterestRate.revisions.type,
                duration: Mongo_budget.defaultInterestRate.revisions.duration,
                expectedPayments: Mongo_budget.defaultInterestRate.revisions.expectedPayments,
                amount: Mongo_budget.defaultInterestRate.revisions.amount,
                isCompounding: Mongo_budget.defaultInterestRate.revisions.isCompounding,
                entryTimestamp: Mongo_budget.defaultInterestRate.revisions.entryTimestamp,
                revisions: Mongo_budget.defaultInterestRate.revisions.revisions,
              }
            : undefined,
      },
      calculatedTotalWithdrawnAmount: Mongo_budget.calculatedTotalWithdrawnAmount,
      calculatedTotalInvestedAmount: Mongo_budget.calculatedTotalInvestedAmount,
      calculatedTotalAvailableAmount: Mongo_budget.calculatedTotalAvailableAmount,
      isArchived: Mongo_budget.isArchived,
    });
  },
};
