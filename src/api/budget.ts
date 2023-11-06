import mongoose, { ClientSession } from 'mongoose';
import { budgetHelpers } from './types/budget/budgetHelpers.js';
import { ITransaction } from './types/transaction/transactionInterface.js';
import transaction from './transaction.js';
import * as User from './user.js';
import { IBudget, IBudgetStats, IBudgetTransaction } from './types/budget/budgetInterface.js';
import { interestRateHelpers } from './types/interestRate/interestRateHelpers.js';
import paranoidCalculator from './utils/paranoidCalculator/paranoidCalculator.js';
import BudgetModel, { IBudgetDocument } from './db/model/BudgetModel.js';
import { paymentFrequencyHelpers } from './types/paymentFrequency/paymentFrequencyHelpers.js';
import TransactionModel from './db/model/TransactionModel.js';
import LoanModel from './db/model/LoanModel.js';
import Loan from './loan.js';
import { ILoan } from './types/loan/loanInterface.js';

export default {
  // As a lender, I want to create a budget, so that I can categorize my investments.
  create: async function createBudget(
    userId: string,
    input: Pick<IBudget, 'name' | 'description' | 'defaultInterestRate' | 'defaultPaymentFrequency'>,
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
      defaultPaymentFrequency: input.defaultPaymentFrequency,
      isArchived: false,
      currentStats: {
        totalInvestedAmount: 0,
        totalWithdrawnAmount: 0,
        totalAvailableAmount: 0,
        currentlyLendedPrincipalToLiveLoansAmount: 0,
        currentlyEarnedInterestAmount: 0,
        totalLostPrincipalToCompletedAndDefaultedLoansAmount: 0,
        totalGains: 0,
        totalForgivenAmount: 0,
        totalLentAmount: 0,
        totalAssociatedLoans: 0,
        totalAssociatedLiveLoans: 0,
      },
      transactionList: [],
    } as IBudget);

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
        await this.updateTransactionList(newBudget, session);
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
    const Mongo_budget: any = await BudgetModel.findOne(
      { _id: budgetId, userId: userId },
      {
        userId: 1,
        name: 1,
        description: 1,
        defaultInterestRate: 1,
        defaultPaymentFrequency: 1,
        isArchived: 1,
        currentStats: 1,
      },
    )
      .session(session)
      .lean();
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
    const Mongo_budgets: any = await BudgetModel.find(
      { userId: userId },
      {
        userId: 1,
        name: 1,
        description: 1,
        defaultInterestRate: 1,
        defaultPaymentFrequency: 1,
        isArchived: 1,
        currentStats: 1,
      },
    )
      .session(session)
      .lean();

    return Mongo_budgets.map((Mongo_budget) => {
      return budgetHelpers.runtimeCast({
        ...Mongo_budget,
        _id: Mongo_budget._id.toString(),
        userId: Mongo_budget.userId.toString(),
      });
    });
  },
  getOneFromUserWithTransactionList: async function getOneBudgetFromUserWithTransactionList(
    { userId, budgetId }: { userId: string; budgetId: string },
    { session = undefined }: { session?: ClientSession } = {},
  ): Promise<IBudget> {
    const Mongo_budget: any = await BudgetModel.findOne({ userId: userId, _id: budgetId }).session(session).lean();
    if (Mongo_budget === null) throw new Error('Budget could not be found');

    return budgetHelpers.runtimeCast({
      ...Mongo_budget,
      _id: Mongo_budget._id.toString(),
      userId: Mongo_budget.userId.toString(),
    });
  },

  getAllFromUserWithTransactionList: async function getAllBudgetsFromUserWithTransactionList(
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
  getBudgetsAtTimestamp: async function getBudgetAtTimestamp(
    { userId, budgetIds, timestampLimit }: { userId: string; budgetIds: string[]; timestampLimit: number },
    { session = undefined }: { session?: ClientSession } = {},
  ): Promise<IBudget[]> {
    const MONGO_BUDGETS: any = await BudgetModel.find(
      { userId: userId, budgetId: { $in: budgetIds } },
      {
        userId: 1,
        name: 1,
        description: 1,
        defaultInterestRate: 1,
        defaultPaymentFrequency: 1,
        isArchived: 1,
        transactionList: 1,
      },
    )
      .session(session)
      .lean();

    // Each MONGO_BUDGET needs currentStats at timestampLimit extracted from transactionList and appended to it
    MONGO_BUDGETS.forEach((MONGO_BUDGET) => {
      const transactions = MONGO_BUDGET.transactionList;
      if (timestampLimit === undefined) {
        MONGO_BUDGET.currentStats = transactions[0].budgetStats;
      } else {
        // Find the first transaction that is older than timestampLimit
        const firstTransactionOlderThanTimestampLimit = transactions.find((transaction) => {
          return transaction.timestamp <= timestampLimit;
        });
        MONGO_BUDGET.currentStats = firstTransactionOlderThanTimestampLimit.budgetStats;
      }

      // cut out transactionList
      delete MONGO_BUDGET.transactionList;
    });

    return MONGO_BUDGETS.map((MONGO_BUDGET) => {
      return budgetHelpers.runtimeCast({
        ...MONGO_BUDGET,
        _id: MONGO_BUDGET._id.toString(),
        userId: MONGO_BUDGET.userId.toString(),
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
      await this.updateTransactionList(budgetId);
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
      await this.updateTransactionList(budgetId);
    }
    return createdTransaction;
  },
  // As a lender, I want to view transactions related to budget, so that I can make decisions.
  getTransactions: async function getBudgetTransactions(
    budgetId: string,
    paginate: { pageNumber: number; pageSize: number },
  ): Promise<IBudgetTransaction[]> {
    const Mongo_budget: any = await BudgetModel.findOne(
      { _id: budgetId },
      { transactionList: { $slice: [paginate.pageNumber * paginate.pageSize, paginate.pageSize] }, _id: 0 },
    ).lean();
    if (Mongo_budget === null) throw new Error('Budget could not be found');

    return Mongo_budget.transactionList;
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
    defaultPaymentFrequencyOccurrence,
    defaultPaymentFrequencyIsStrict,
    defaultPaymentFrequencyStrictValue,
    isArchived,
  }: {
    budgetId: string;
    name?: string;
    description?: string;
    defaultInterestRateType?: string;
    defaultInterestRateDuration?: string;
    defaultInterestRateAmount?: number;
    defaultInterestRateIsCompounding?: number;
    defaultPaymentFrequencyOccurrence?: string;
    defaultPaymentFrequencyIsStrict?: boolean;
    defaultPaymentFrequencyStrictValue?: string;
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
        revisions: newInfo.defaultInterestRate.revisions,
      };
      if (defaultInterestRateType !== undefined)
        newInfo.defaultInterestRate.type = interestRateHelpers.validate.type(defaultInterestRateType);
      if (defaultInterestRateDuration !== undefined)
        newInfo.defaultInterestRate.duration = interestRateHelpers.validate.duration(defaultInterestRateDuration);
      if (defaultInterestRateAmount !== undefined)
        newInfo.defaultInterestRate.amount = interestRateHelpers.validate.amount(defaultInterestRateAmount);
      if (defaultInterestRateIsCompounding !== undefined)
        newInfo.defaultInterestRate.isCompounding = defaultInterestRateIsCompounding;
      newInfo.defaultInterestRate.entryTimestamp = interestRateHelpers.validate.entryTimestamp(Date.now());
    }
    // check if defaultPaymentFrequency needs to change
    if (
      defaultPaymentFrequencyOccurrence !== undefined ||
      defaultPaymentFrequencyIsStrict !== undefined ||
      defaultPaymentFrequencyStrictValue !== undefined
    ) {
      // push current defaultPaymentFrequency into revisions
      newInfo.defaultPaymentFrequency = budget.defaultPaymentFrequency;
      newInfo.defaultPaymentFrequency.revisions = {
        occurrence: newInfo.defaultPaymentFrequency.occurrence,
        isStrict: newInfo.defaultPaymentFrequency.isStrict,
        strictValue: newInfo.defaultPaymentFrequency.strictValue,
        entryTimestamp: newInfo.defaultPaymentFrequency.entryTimestamp,
        revisions: newInfo.defaultPaymentFrequency.revisions,
      };
      if (defaultPaymentFrequencyOccurrence !== undefined)
        newInfo.defaultPaymentFrequency.occurrence = paymentFrequencyHelpers.validate.occurrence(
          defaultPaymentFrequencyOccurrence,
        );
      if (defaultPaymentFrequencyIsStrict !== undefined)
        newInfo.defaultPaymentFrequency.isStrict = paymentFrequencyHelpers.validate.isStrict(
          defaultPaymentFrequencyIsStrict,
        );
      if (defaultPaymentFrequencyStrictValue !== undefined)
        newInfo.defaultPaymentFrequency.strictValue = paymentFrequencyHelpers.validate.strictValue(
          defaultPaymentFrequencyStrictValue,
        );
      newInfo.defaultPaymentFrequency.entryTimestamp = paymentFrequencyHelpers.validate.entryTimestamp(Date.now());
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
   */
  getStatsAtTimestamp: async function getBudgetStatsAtTimestamp({
    budgetId,
    timestampLimit,
  }: {
    budgetId: string;
    timestampLimit?: number;
  }): Promise<IBudgetStats> {
    const MONGO_BUDGET = await BudgetModel.findOne({ _id: budgetId });

    const transactions = MONGO_BUDGET.transactionList;

    if (timestampLimit === undefined) return transactions[0].budgetStats;

    // Find the first transaction that is older than timestampLimit
    const firstTransactionOlderThanTimestampLimit = transactions.find((transaction) => {
      return transaction.timestamp <= timestampLimit;
    });
    return firstTransactionOlderThanTimestampLimit.budgetStats;
  },

  updateTransactionList: async function generateTransactionList(
    input: string | IBudgetDocument,
    session: ClientSession = undefined,
  ): Promise<IBudgetTransaction[]> {
    const MONGO_BUDGET = typeof input === 'string' ? await BudgetModel.findOne({ _id: input }).session(session) : input;

    const budgetId = MONGO_BUDGET._id.toString();
    const relatedLoansIds = await LoanModel.find({
      'calculatedRelatedBudgets.budgetId': budgetId,
    })
      .session(session)
      .select('_id')
      .lean();

    const transactions = await TransactionModel.find({
      $or: [
        {
          'from.datatype': 'BUDGET',
          'from.addressId': budgetId,
        },
        {
          'to.datatype': 'BUDGET',
          'to.addressId': budgetId,
        },
        {
          'from.datatype': 'OUTSIDE',
          'to.datatype': 'LOAN',
          'to.addressId': {
            $in: relatedLoansIds, // This will fetch all the loan IDs associated with the budget
          },
        },
        {
          'from.datatype': 'LOAN',
          'to.datatype': 'OUTSIDE',
          'from.addressId': {
            $in: relatedLoansIds, // Same as above
          },
        },
        /*{
          'from.datatype': 'LOAN',
          'to.datatype': 'FORGIVENESS',
          'from.addressId': {
            $in: relatedLoansIds, // Same as above
          },
        },*/
      ],
    })
      .session(session)
      .sort({ transactionTimestamp: 1 })
      .lean()
      .exec();

    if (transactions.length === 0) return [];

    const relatedLoans: ILoan[] = await Promise.all(
      relatedLoansIds.map(async (loan) => {
        return await Loan.getOneFromUser({ userId: MONGO_BUDGET.userId, loanId: loan._id.toString() }, { session });
      }),
    );

    const currentLoanStats = {};
    relatedLoans.forEach((loan) => {
      currentLoanStats[loan._id.toString()] = {
        amountLent: 0,
        amountPaidBack: 0,
        amountForgiven: 0,
        status: undefined,
      };
    });

    const TRANSACTION_LIST: IBudgetTransaction[] = [];

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      updateRelatedLoansStatuses(transaction.transactionTimestamp);
      if (i == 0) {
        // Assuming that first transaction is always a deposit to budget
        if (!(transaction.to.datatype === 'BUDGET' && transaction.from.datatype === 'OUTSIDE'))
          throw new Error(
            'First transaction is not a deposit to budget. This should not happen. Budget with ID is broken: ' +
              budgetId,
          );
        TRANSACTION_LIST.push({
          _id: transaction._id.toString(),
          timestamp: transaction.transactionTimestamp,
          description: transaction.description,
          from: transaction.from,
          to: transaction.to,
          amount: transaction.amount,
          budgetStats: {
            totalInvestedAmount: transaction.amount,
            totalWithdrawnAmount: 0,
            totalAvailableAmount: transaction.amount,
            currentlyLendedPrincipalToLiveLoansAmount: 0,
            currentlyEarnedInterestAmount: 0,
            totalLostPrincipalToCompletedAndDefaultedLoansAmount: 0,
            totalGains: 0,
            totalForgivenAmount: 0,
            totalLentAmount: 0,
            totalAssociatedLoans: 0,
            totalAssociatedLiveLoans: 0,
            avarageAssociatedLoanDuration: null,
            avarageAssociatedLoanAmount: null,
          },
        });
      } else if (transaction.from.datatype === 'OUTSIDE' && transaction.to.datatype === 'BUDGET') {
        TRANSACTION_LIST.push({
          _id: transaction._id.toString(),
          timestamp: transaction.transactionTimestamp,
          description: transaction.description,
          from: transaction.from,
          to: transaction.to,
          amount: transaction.amount,
          budgetStats: {
            ...TRANSACTION_LIST[i - 1].budgetStats,
            ...calculatedFields(transaction),
            totalInvestedAmount: paranoidCalculator.add(
              TRANSACTION_LIST[i - 1].budgetStats.totalInvestedAmount,
              transaction.amount,
            ),
            totalAvailableAmount: paranoidCalculator.add(
              TRANSACTION_LIST[i - 1].budgetStats.totalAvailableAmount,
              transaction.amount,
            ),
          },
        });
      } else if (transaction.from.datatype === 'BUDGET' && transaction.to.datatype === 'OUTSIDE') {
        TRANSACTION_LIST.push({
          _id: transaction._id.toString(),
          timestamp: transaction.transactionTimestamp,
          description: transaction.description,
          from: transaction.from,
          to: transaction.to,
          amount: transaction.amount,
          budgetStats: {
            ...TRANSACTION_LIST[i - 1].budgetStats,
            ...calculatedFields(transaction),
            totalWithdrawnAmount: paranoidCalculator.add(
              TRANSACTION_LIST[i - 1].budgetStats.totalWithdrawnAmount,
              transaction.amount,
            ),
            totalAvailableAmount: paranoidCalculator.subtract(
              TRANSACTION_LIST[i - 1].budgetStats.totalAvailableAmount,
              transaction.amount,
            ),
          },
        });
      } else if (transaction.from.datatype === 'BUDGET' && transaction.to.datatype === 'LOAN') {
        currentLoanStats[transaction.to.addressId].amountLent = paranoidCalculator.add(
          currentLoanStats[transaction.to.addressId].amountLent,
          transaction.amount,
        );

        TRANSACTION_LIST.push({
          _id: transaction._id.toString(),
          timestamp: transaction.transactionTimestamp,
          description: transaction.description,
          from: transaction.from,
          to: transaction.to,
          amount: transaction.amount,
          budgetStats: {
            ...TRANSACTION_LIST[i - 1].budgetStats,
            ...calculatedFields(transaction),
            totalWithdrawnAmount: paranoidCalculator.add(
              TRANSACTION_LIST[i - 1].budgetStats.totalWithdrawnAmount,
              transaction.amount,
            ),
            totalAvailableAmount: paranoidCalculator.subtract(
              TRANSACTION_LIST[i - 1].budgetStats.totalAvailableAmount,
              transaction.amount,
            ),
          },
        });
      } else if (transaction.from.datatype === 'OUTSIDE' && transaction.to.datatype === 'LOAN') {
        // payment
        /**
         * To pomeni, da se mora generirati transakcija, ki gre from "LOAN" v "BUDGET".
         * Timestamp in description se kopirata.
         * From je "LOAN", to je "BUDGET".
         * Amount je odvisen od tega, koliko je budget investiral v loan. Če ima loan investicije iz več budgetov, se razdeli, glede na to, koliko je investiral vsak budget.
         * BudgetStats se kopirajo iz prejšnje transakcije, razen:
         * - totalAvailableAmount se poveča za amount
         */

        const relatedLoan = relatedLoans.find((loan) => loan._id.toString() === transaction.to.addressId.toString());
        const transactionInLoan = relatedLoan.transactionList.find(
          (loanTransaction) => loanTransaction._id.toString() === transaction._id.toString(),
        );
        const percentageInvestedByBudget = Loan.getBudgetInvestmentPercentageAtTimestamp(
          relatedLoan,
          budgetId,
          transaction.transactionTimestamp,
        );
        currentLoanStats[transaction.to.addressId].amountPaidBack = paranoidCalculator.add(
          currentLoanStats[transaction.to.addressId].amountPaidBack,
          paranoidCalculator.multiply(transaction.amount, percentageInvestedByBudget),
        );

        TRANSACTION_LIST.push({
          _id: transaction._id.toString(),
          timestamp: transaction.transactionTimestamp,
          description: transaction.description,
          from: transaction.to, // LOAN
          to: {
            datatype: 'BUDGET',
            addressId: budgetId,
          },
          amount: paranoidCalculator.multiply(transaction.amount, percentageInvestedByBudget),
          budgetStats: {
            ...TRANSACTION_LIST[i - 1].budgetStats,
            ...calculatedFields(transaction),
            totalAvailableAmount: paranoidCalculator.add(
              TRANSACTION_LIST[i - 1].budgetStats.totalAvailableAmount,
              paranoidCalculator.multiply(transaction.amount, percentageInvestedByBudget),
            ),
            currentlyEarnedInterestAmount: paranoidCalculator.add(
              TRANSACTION_LIST[i - 1].budgetStats.currentlyEarnedInterestAmount,
              paranoidCalculator.multiply(transactionInLoan.interestPaid, percentageInvestedByBudget),
            ),
          },
        });
      } else if (transaction.from.datatype === 'LOAN' && transaction.to.datatype === 'OUTSIDE') {
        // refund payment
        const relatedLoan = relatedLoans.find((loan) => loan._id.toString() === transaction.from.addressId.toString());
        /*const transactionInLoan = relatedLoan.transactionList.find(
          (loanTransaction) => loanTransaction._id.toString() === transaction._id.toString(),
        );
        const percentagePaidBackToBudget = paranoidCalculator.divide(
          currentLoanStats[transaction.from.addressId.toString()].amountPaidBack,
          transactionInLoan.refundedAmount,
        );
        
        if (percentagePaidBackToBudget > 0) {
          currentLoanStats[transaction.from.addressId.toString()].amountPaidBack = paranoidCalculator.subtract(
            currentLoanStats[transaction.from.addressId.toString()].amountPaidBack,
            paranoidCalculator.multiply(transaction.amount, percentagePaidBackToBudget),
          );
        */
        const percentageInvestedByBudget = Loan.getBudgetInvestmentPercentageAtTimestamp(
          relatedLoan,
          budgetId,
          transaction.transactionTimestamp,
        );
        if (percentageInvestedByBudget > 0) {
          currentLoanStats[transaction.from.addressId.toString()].amountPaidBack = paranoidCalculator.subtract(
            currentLoanStats[transaction.from.addressId.toString()].amountPaidBack,
            paranoidCalculator.multiply(transaction.amount, percentageInvestedByBudget),
          );

          TRANSACTION_LIST.push({
            _id: transaction._id.toString(),
            timestamp: transaction.transactionTimestamp,
            description: transaction.description,
            from: {
              datatype: 'BUDGET',
              addressId: budgetId,
            },
            to: transaction.to, // LOAN
            amount: paranoidCalculator.multiply(transaction.amount, percentageInvestedByBudget),
            budgetStats: {
              ...TRANSACTION_LIST[i - 1].budgetStats,
              ...calculatedFields(transaction),
              totalAvailableAmount: paranoidCalculator.subtract(
                TRANSACTION_LIST[i - 1].budgetStats.totalAvailableAmount,
                paranoidCalculator.multiply(transaction.amount, percentageInvestedByBudget),
              ),
            },
          });
        }
      } else if (transaction.from.datatype === 'LOAN' && transaction.to.datatype === 'FORGIVENESS') {
        // forgiveness of loan
        /* Actually there is nothing to do there, because forgiveness is not a transaction, but a change in loan principal.
        
        const relatedLoan = relatedLoans.find((loan) => loan._id.toString() === transaction.from.addressId.toString());
        const percentageInvestedByBudget = Loan.getBudgetInvestmentPercentageAtTimestamp(
          relatedLoan,
          budgetId,
          transaction.transactionTimestamp,
        );

        TRANSACTION_LIST.push({
          _id: transaction._id.toString(),
          timestamp: transaction.transactionTimestamp,
          description: transaction.description,
          from: {
            datatype: 'BUDGET',
            addressId: budgetId,
          },
          to: transaction.to, // FORGIVENESS
          amount: paranoidCalculator.multiply(transaction.amount, percentageInvestedByBudget),
          budgetStats: {
            ...TRANSACTION_LIST[i - 1].budgetStats,
            ...calculatedFields(transaction),
            totalForgivenAmount: paranoidCalculator.add(
              TRANSACTION_LIST[i - 1].budgetStats.totalForgivenAmount,
              paranoidCalculator.multiply(transaction.amount, percentageInvestedByBudget),
            ),
          },
        });
        */
      } else if (transaction.from.datatype === 'INTEREST' && transaction.to.datatype === 'LOAN') {
        // manual interest / fee
        // Not sure if there is anything to do here
        console.log('x');
      } else {
        throw new Error('Should not happen');
      }
    }
    TRANSACTION_LIST.reverse();
    MONGO_BUDGET.transactionList = TRANSACTION_LIST;
    MONGO_BUDGET.currentStats = TRANSACTION_LIST[0].budgetStats;
    await MONGO_BUDGET.save({ session });
    return TRANSACTION_LIST;

    function updateRelatedLoansStatuses(timestamp: number): void {
      Object.keys(currentLoanStats).forEach((loanId) => {
        currentLoanStats[loanId].status = Loan.getStatusAtTimestamp(
          relatedLoans.find((loan) => loan._id.toString() === loanId),
          timestamp,
        );
      });
    }

    function calculatedFields(
      transaction,
    ): Pick<
      IBudgetStats,
      | 'currentlyLendedPrincipalToLiveLoansAmount'
      | 'totalGains'
      | 'totalLostPrincipalToCompletedAndDefaultedLoansAmount'
      | 'totalLentAmount'
      | 'totalAssociatedLoans'
      | 'totalAssociatedLiveLoans'
      | 'avarageAssociatedLoanDuration'
      | 'avarageAssociatedLoanAmount'
    > {
      return {
        currentlyLendedPrincipalToLiveLoansAmount: currentlyLendedPrincipalToLiveLoansAmount(),
        totalGains: totalGains(),
        totalLostPrincipalToCompletedAndDefaultedLoansAmount: totalLostOnCompletedAndDefaultedLoans(),
        totalLentAmount: totalLentAmount(),
        totalAssociatedLoans: totalAssociatedLoans(),
        totalAssociatedLiveLoans: totalAssociatedLiveLoans(),
        avarageAssociatedLoanDuration: avarageLoanDuration(),
        avarageAssociatedLoanAmount: avarageLoanAmount(transaction),
      };
    }
    function currentlyLendedPrincipalToLiveLoansAmount(): number {
      return Object.keys(currentLoanStats).reduce((acc, loanId) => {
        if (
          currentLoanStats[loanId].status === 'ACTIVE' ||
          currentLoanStats[loanId].status === 'PAUSED' ||
          currentLoanStats[loanId].status === 'PAID'
        ) {
          return paranoidCalculator.add(acc, currentLoanStats[loanId].amountLent);
        }
        return acc;
      }, 0);
    }
    function totalGains(): number {
      // Total gains are defined as sum of all currentLoanStats.amountPaidBack - currentLoanStats.amountLent on all completed or defaulted loans.

      return Object.keys(currentLoanStats).reduce((acc, loanId) => {
        if (currentLoanStats[loanId].status === 'COMPLETED' || currentLoanStats[loanId].status === 'DEFAULTED') {
          const gainOnLoan = paranoidCalculator.subtract(
            currentLoanStats[loanId].amountPaidBack,
            currentLoanStats[loanId].amountLent,
          );
          if (gainOnLoan > 0) {
            return paranoidCalculator.add(gainOnLoan, acc);
          } else {
            return acc;
          }
        } else return acc;
      }, 0);
    }
    function totalLostOnCompletedAndDefaultedLoans(): number {
      return Object.keys(currentLoanStats).reduce((acc, loanId) => {
        if (currentLoanStats[loanId].status === 'COMPLETED' || currentLoanStats[loanId].status === 'DEFAULTED') {
          const lossOnLoan = paranoidCalculator.subtract(
            currentLoanStats[loanId].amountLent,
            currentLoanStats[loanId].amountPaidBack,
          );
          if (lossOnLoan > 0) {
            return lossOnLoan + acc;
          } else {
            return acc;
          }
        } else return acc;
      }, 0);
    }
    function totalLentAmount(): number {
      return Object.keys(currentLoanStats).reduce((acc, loanId) => {
        if (currentLoanStats[loanId].status !== undefined)
          return paranoidCalculator.add(acc, currentLoanStats[loanId].amountLent);
        else return acc;
      }, 0);
    }
    function totalAssociatedLoans(): number {
      return Object.keys(currentLoanStats).filter((loanId) => {
        return currentLoanStats[loanId].status !== undefined;
      }).length;
    }
    function totalAssociatedLiveLoans(): number {
      return Object.keys(currentLoanStats).filter((loanId) => {
        return (
          currentLoanStats[loanId].status === 'ACTIVE' ||
          currentLoanStats[loanId].status === 'PAUSED' ||
          currentLoanStats[loanId].status === 'PAID'
        );
      }).length;
    }
    function avarageLoanAmount(transaction): number {
      return relatedLoans.reduce((acc, loan) => {
        if (currentLoanStats[loan._id.toString()].status === undefined) return acc;
        if (
          loan.transactionList.find((loanTransaction) => loanTransaction._id === transaction._id.toString()) ===
          undefined
        )
          return acc;

        if (acc === 0)
          return loan.transactionList.find((loanTransaction) => loanTransaction._id === transaction._id.toString())
            .totalInvested;
        else
          return paranoidCalculator.divide(
            paranoidCalculator.add(
              loan.transactionList.find((loanTransaction) => loanTransaction._id === transaction._id.toString())
                .totalInvested,
              acc,
            ),
            2,
          );
      }, 0);
    }
    function avarageLoanDuration(): number {
      return relatedLoans.reduce((acc, loan) => {
        if (currentLoanStats[loan._id.toString()].status === undefined) return acc;

        if (acc === 0) return loan.closesTimestamp - loan.openedTimestamp;
        else return (loan.closesTimestamp - loan.openedTimestamp + acc) / 2;
      }, 0);
    }
  },

  recalculateCalculatedValues: async function recalculateCalculatedBudgetValues(
    input: string | IBudgetDocument,
  ): Promise<IBudget> {
    const MONGO_BUDGET = typeof input === 'string' ? await BudgetModel.findOne({ _id: input }) : input;

    /*const CALCULATED_VALUES = await this.getCalculatedValuesAtTimestamp({
      budgetId: MONGO_BUDGET._id.toString(),
      timestampLimit: undefined, // get all transactions
    });*/

    // save calculations to DB
    /*MONGO_BUDGET.calculatedTotalInvestedAmount = CALCULATED_VALUES.calculatedTotalInvestedAmount;
    MONGO_BUDGET.calculatedTotalWithdrawnAmount = CALCULATED_VALUES.calculatedTotalWithdrawnAmount;
    MONGO_BUDGET.calculatedTotalAvailableAmount = CALCULATED_VALUES.calculatedTotalAvailableAmount;
    MONGO_BUDGET.calculatedCurrentlyLendedPrincipalToLiveLoansAmount =
      CALCULATED_VALUES.calculatedCurrentlyLendedPrincipalToLiveLoansAmount;
    MONGO_BUDGET.calculatedCurrentlyEarnedInterestAmount = CALCULATED_VALUES.calculatedCurrentlyEarnedInterestAmount;
    MONGO_BUDGET.calculatedTotalLostPrincipalToCompletedAndDefaultedLoansAmount =
      CALCULATED_VALUES.calculatedTotalLostPrincipalToCompletedAndDefaultedLoansAmount;
    MONGO_BUDGET.calculatedTotalGains = CALCULATED_VALUES.calculatedTotalGains;
    MONGO_BUDGET.calculatedTotalLentAmount = CALCULATED_VALUES.calculatedTotalLentAmount;
    MONGO_BUDGET.calculatedTotalAssociatedLoans = CALCULATED_VALUES.calculatedTotalAssociatedLoans;
    MONGO_BUDGET.calculatedTotalAssociatedLiveLoans = CALCULATED_VALUES.calculatedTotalAssociatedLiveLoans;
    MONGO_BUDGET.calculatedAvarageAssociatedLoanDuration = CALCULATED_VALUES.calculatedAvarageAssociatedLoanDuration;
    MONGO_BUDGET.calculatedAvarageAssociatedLoanAmount = CALCULATED_VALUES.calculatedAvarageAssociatedLoanAmount;*/

    await MONGO_BUDGET.save();
    return budgetHelpers.runtimeCast({
      ...MONGO_BUDGET.toObject(),
      _id: MONGO_BUDGET._id.toString(),
      userId: MONGO_BUDGET.userId.toString(),
    });
  },
};
