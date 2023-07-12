import mongoose, { ClientSession } from 'mongoose';
import { budgetHelpers } from './types/budget/budgetHelpers.js';
import { ITransaction } from './types/transaction/transactionInterface.js';
import transaction from './transaction.js';
import * as User from './user.js';
import { IBudget } from './types/budget/budgetInterface.js';
import { interestRateHelpers } from './types/interestRate/interestRateHelpers.js';
import paranoidCalculator from './utils/paranoidCalculator/paranoidCalculator.js';
import BudgetModel, { IBudgetDocument } from './db/model/BudgetModel.js';

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

    // Check if user exists
    await User.checkIfExists(userId);

    const budget: IBudget = budgetHelpers.runtimeCast({
      _id: new mongoose.Types.ObjectId().toString(),
      userId: userId,
      name: input.name,
      description: input.description,
      defaultInterestRate: input.defaultInterestRate,
      calculatedTotalWithdrawnAmount: 0,
      calculatedTotalInvestedAmount: inititalTransactionAmount,
      calculatedTotalAvailableAmount: inititalTransactionAmount,
      isArchived: false,
    });

    const session: ClientSession = await mongoose.connection.startSession();
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
            transactionTimestamp: -1,
            description: initialTransactionDescription,
            amount: inititalTransactionAmount,
          },
          { session: session, runRecalculate: false },
        );
      }

      await session.commitTransaction();

      // return casted budget
      return budgetHelpers.runtimeCast({
        ...newBudget.toObject(),
        _id: newBudget._id.toString(),
        userId: newBudget.userId.toString(),
      });
    } catch (err) {
      console.log(err);
      await session.abortTransaction();
      throw new Error('Budget creation failed!');
    } finally {
      session.endSession();
    }
  },
  checkIfExists: async function checkIfBudgetExists(budgetId: string, session?: ClientSession): Promise<void> {
    if (!(await BudgetModel.existsOneWithId(budgetId, session)))
      throw new Error('Budget with prodived _id does not exist!');
  },
  getOneFromUser: async function getBudget(
    {
      userId,
      budgetId,
    }: {
      userId: string;
      budgetId: string;
    },
    { session = undefined }: { session?: ClientSession } = {},
  ): Promise<IBudget> {
    const Mongo_budget: any = await BudgetModel.findOne({ _id: budgetId, userId: userId }).session(session).lean();
    if (Mongo_budget === null) throw new Error('Budget could not be found');
    return budgetHelpers.runtimeCast({
      ...Mongo_budget,
      _id: Mongo_budget._id.toString(),
      userId: Mongo_budget.userId.toString(),
    });
  },
  // As a lender, I want to view a list of budgets with basic information, so that I can have a general overview of my investments.
  getAllFromUser: async function getBudgets(
    { userId }: { userId: string },
    { session = undefined }: { session?: ClientSession } = {},
  ): Promise<IBudget[]> {
    const Mongo_budgets: any = await BudgetModel.find({ userId: userId }).session(session).lean();

    return Mongo_budgets.map((Mongo_budget) => {
      return budgetHelpers.runtimeCast({
        ...Mongo_budget,
        _id: Mongo_budget._id.toString(),
        userId: Mongo_budget.userId.toString(),
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
    {
      session = undefined,
      runRecalculate = true,
    }: {
      session?: ClientSession;
      runRecalculate?: boolean;
    } = {},
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
    const createdTransaction = await transaction.add(newTransaction, { session: session });
    if (runRecalculate) {
      await this.recalculateCalculatedValues(await BudgetModel.findOne({ _id: budgetId, userId: userId }));
    }
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
    {
      session = undefined,
      runRecalculate = true,
    }: {
      session?: ClientSession;
      runRecalculate?: boolean;
    } = {},
  ): Promise<ITransaction> {
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
    const createdTransaction = await transaction.add(newTransaction, { session: session });
    if (runRecalculate) {
      await this.recalculateCalculatedValues(await BudgetModel.findOne({ _id: budgetId, userId: userId }));
    }
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
    // Check if budget exists
    this.checkIfExists(budgetId);

    // Get budget
    const budget = await BudgetModel.findOne({ _id: budgetId });

    budget.isArchived = isArchived;
    const changedBudget = budgetHelpers.runtimeCast({
      ...budget.toObject(),
      _id: budget._id.toString(),
      userId: budget.userId.toString(),
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
    defaultInterestRateAmount,
    defaultInterestRateIsCompounding,
    isArchived,
  }: {
    budgetId: string;
    name?: string;
    description?: string;
    defaultInterestRateType?: string;
    defaultInterestRateDuration?: string;
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
      defaultInterestRateAmount !== undefined ||
      defaultInterestRateIsCompounding !== undefined
    ) {
      // push current defaultInterestRate into revisions
      newInfo.defaultInterestRate = budget.defaultInterestRate;
      newInfo.defaultInterestRate.revisions = {
        type: newInfo.defaultInterestRate.type,
        duration: newInfo.defaultInterestRate.duration,
        amount: newInfo.defaultInterestRate.amount,
        isCompounding: newInfo.defaultInterestRate.isCompounding,
        entryTimestamp: newInfo.defaultInterestRate.entryTimestamp,
      };
      if (defaultInterestRateType !== undefined)
        newInfo.defaultInterestRate.type = interestRateHelpers.validate.type(defaultInterestRateType);
      if (defaultInterestRateDuration !== undefined)
        newInfo.defaultInterestRate.duration = interestRateHelpers.validate.duration(defaultInterestRateDuration);
      if (defaultInterestRateAmount !== undefined)
        newInfo.defaultInterestRate.amount = interestRateHelpers.validate.amount(defaultInterestRateAmount);
      if (defaultInterestRateIsCompounding !== undefined)
        newInfo.defaultInterestRate.isCompounding = defaultInterestRateIsCompounding;
      newInfo.defaultInterestRate.entryTimestamp = interestRateHelpers.validate.entryTimestamp(new Date().getTime());
    }
    budget.set(newInfo);
    const changedBudget = budgetHelpers.runtimeCast({
      ...budget.toObject(),
      _id: budget._id.toString(),
      userId: budget.userId.toString(),
    });
    await budget.save();
    return changedBudget;
  },
  /**
   * @param  {string} budgetId - _id of budget
   * @param  {number} timestampLimit - DateTime (timestamp) of resulting calculated values. This value is used to retrieve
   * calculated values at any point in past.
   * @returns {Promise} Pick<IBudget, 'calculatedTotalInvestedAmount' | 'calculatedTotalWithdrawnAmount' | 'calculatedTotalAvailableAmount'>
   */
  getCalculatedValuesAtTimestamp: async function getBudgetCalculatedValuesAtTimestamp({
    budgetId,
    timestampLimit,
  }: {
    budgetId: string;
    timestampLimit?: number;
  }): Promise<
    Pick<IBudget, 'calculatedTotalInvestedAmount' | 'calculatedTotalWithdrawnAmount' | 'calculatedTotalAvailableAmount'>
  > {
    // get all transactions
    // NOTE TO SELF: Transactions should maybe be passed as argument.
    const budgetTransactions: ITransaction[] = await this.getTransactions(budgetId, {
      pageNumber: 0,
      pageSize: Infinity,
    });

    // initialize variables
    const calculatedValues: Pick<
      IBudget,
      'calculatedTotalInvestedAmount' | 'calculatedTotalWithdrawnAmount' | 'calculatedTotalAvailableAmount'
    > = {
      calculatedTotalInvestedAmount: 0,
      calculatedTotalWithdrawnAmount: 0,
      calculatedTotalAvailableAmount: 0,
    };
    let tmpCalculatedAvaiableAmount = 0;

    // Loop and affect calculatedValues
    for (let i = budgetTransactions.length - 1; i >= 0; i--) {
      const TRANSACTION = budgetTransactions[i];
      applyTransactionToTotalInvestedAmount(TRANSACTION);
      applyTransactionToTotalWithdrawnAmount(TRANSACTION);
      applyTransactionToTotalAvaiableAmount(TRANSACTION);
    }

    return calculatedValues;

    // Abstractions
    function applyTransactionToTotalInvestedAmount(transaction: ITransaction): void {
      // totalInvestedAmount is only affected until timestampLimit (or get all transactions if timestampLimit is undefined)
      if (transaction.transactionTimestamp <= timestampLimit || timestampLimit === undefined)
        if (transaction.to.datatype === 'BUDGET' && transaction.from.datatype === 'OUTSIDE') {
          calculatedValues.calculatedTotalInvestedAmount = paranoidCalculator.add(
            calculatedValues.calculatedTotalInvestedAmount,
            transaction.amount,
          );
        }
    }
    function applyTransactionToTotalWithdrawnAmount(transaction: ITransaction): void {
      // totalWithdrawnAmount is only affected until timestampLimit (or get all transactions if timestampLimit is undefined)
      if (transaction.transactionTimestamp <= timestampLimit || timestampLimit === undefined)
        if (transaction.to.datatype === 'OUTSIDE' && transaction.from.datatype === 'BUDGET') {
          calculatedValues.calculatedTotalWithdrawnAmount = paranoidCalculator.add(
            calculatedValues.calculatedTotalWithdrawnAmount,
            transaction.amount,
          );
        }
    }
    function applyTransactionToTotalAvaiableAmount(transaction: ITransaction): void {
      if (transaction.to.datatype === 'BUDGET') {
        tmpCalculatedAvaiableAmount = paranoidCalculator.add(tmpCalculatedAvaiableAmount, transaction.amount);
      } else if (transaction.from.datatype === 'BUDGET') {
        tmpCalculatedAvaiableAmount = paranoidCalculator.subtract(tmpCalculatedAvaiableAmount, transaction.amount);
      }
      /**
       * Apply every new tmpCalculatedAvaiableAmount until timestampLimit,
       * after that only apply tmpCalculatedAvaiableAmount if it reaches new low value.
       */
      if (transaction.transactionTimestamp <= timestampLimit || timestampLimit === undefined) {
        calculatedValues.calculatedTotalAvailableAmount = tmpCalculatedAvaiableAmount;
      } else {
        if (tmpCalculatedAvaiableAmount < calculatedValues.calculatedTotalAvailableAmount)
          calculatedValues.calculatedTotalAvailableAmount = tmpCalculatedAvaiableAmount;
      }
    }
  },
  recalculateCalculatedValues: async function recalculateCalculatedBudgetValues(
    input: string | IBudgetDocument,
  ): Promise<IBudget> {
    const MONGO_BUDGET = typeof input === 'string' ? await BudgetModel.findOne({ _id: input }) : input;

    const CALCULATED_VALUES = await this.getCalculatedValuesAtTimestamp({
      budgetId: MONGO_BUDGET._id.toString(),
      timestampLimit: undefined, // get all transactions
    });

    // save calculations to DB
    MONGO_BUDGET.calculatedTotalInvestedAmount = CALCULATED_VALUES.calculatedTotalInvestedAmount;
    MONGO_BUDGET.calculatedTotalWithdrawnAmount = CALCULATED_VALUES.calculatedTotalWithdrawnAmount;
    MONGO_BUDGET.calculatedTotalAvailableAmount = CALCULATED_VALUES.calculatedTotalAvailableAmount;

    await MONGO_BUDGET.save();
    return budgetHelpers.runtimeCast({
      ...MONGO_BUDGET.toObject(),
      _id: MONGO_BUDGET._id.toString(),
      userId: MONGO_BUDGET.userId.toString(),
    });
  },
};
