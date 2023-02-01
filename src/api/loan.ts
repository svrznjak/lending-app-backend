import mongoose, { ClientSession } from 'mongoose';
import {
  //add,
  differenceInHours,
  differenceInCalendarDays,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachYearOfInterval,
} from 'date-fns';
import * as User from './user.js';
import transaction from './transaction.js';
import { loanHelpers } from './types/loan/loanHelpers.js';
import { ILoan, IRelatedBudget, ITransactionInterval } from './types/loan/loanInterface.js';
import { ITransaction } from './types/transaction/transactionInterface.js';
import Budget from './budget.js';
import { transactionHelpers } from './types/transaction/transactionHelpers.js';
import { IInterestRate, IAmortizationInterval } from './types/interestRate/interestRateInterface.js';
import LoanModel, { ILoanDocument } from './db/model/LoanModel.js';
import LoanCache from './cache/loanCache.js';
import _ from 'lodash';
import { INote } from './types/note/noteInterface.js';
import { noteHelpers } from './types/note/noteHelpers.js';

interface fund {
  budgetId: string;
  amount: number;
}

export default {
  // As a lender, I want to create new loans, so that I can later track specific loan transactions and info.
  create: async function createLoan(
    userId: string,
    input: Pick<ILoan, 'name' | 'description' | 'openedTimestamp' | 'closesTimestamp' | 'interestRate'>,
    funds: fund[],
    initialTransactionDescription: string,
  ): Promise<ILoan> {
    // Do checks on inputs
    loanHelpers.validate.all(input);
    loanHelpers.sanitize.all(input);

    if (funds.length <= 0) throw new Error('Funds should be provided to new loan!');

    // check if user exists
    User.checkIfExists(userId);

    // check if budgets exist
    for (let i = 0; i < funds.length; i++) {
      Budget.checkIfExists(funds[i].budgetId);

      // TODO: This is incorrect + real test happens on transaction level
      /*
      const recalculatedBudget = await Budget.recalculateCalculatedValues(MONGO_LOAN.{
      if (recalculatedBudget.calculatedTotalAvailableAmount < funds[i].amount)
        throw new Error(`Budget (id: ${funds[i].budgetId}) has insufficient funds.`);
        */
    }

    const session: ClientSession = await mongoose.connection.startSession();
    try {
      session.startTransaction();

      const Mongo_Loan: ILoanDocument = await new LoanModel(
        loanHelpers.runtimeCast({
          _id: new mongoose.Types.ObjectId().toString(),
          userId: userId,
          ...input,
          notes: [],
          status: 'ACTIVE',
          calculatedInvestedAmount: 0,
          calculatedOutstandingInterest: 0,
          calculatedPaidInterest: 0,
          calculatedTotalPaidPrincipal: 0,
          calculatedLastTransactionTimestamp: input.openedTimestamp,
          calculatedRelatedBudgets: [],
        }),
      ).save({ session });

      // Prepare initial transactions from budgets to loan in creation
      for (let i = 0; i < funds.length; i++) {
        await transaction.add(
          {
            userId,
            transactionTimestamp: transactionHelpers.validate.transactionTimestamp(Mongo_Loan.openedTimestamp),
            description: initialTransactionDescription,
            from: {
              datatype: 'BUDGET',
              addressId: funds[i].budgetId,
            },
            to: {
              datatype: 'LOAN',
              addressId: Mongo_Loan._id.toString(),
            },
            amount: funds[i].amount,
            entryTimestamp: transactionHelpers.validate.entryTimestamp(new Date().getTime()),
          },
          { session: session },
        );
      }

      await session.commitTransaction();

      // recalculate affected budgets
      for (const fund of funds) {
        await Budget.recalculateCalculatedValues(fund.budgetId);
      }

      const recalculatedLoan: ILoan = await this.recalculateCalculatedValues(Mongo_Loan);

      return recalculatedLoan;
    } catch (err) {
      console.log(err);
      await session.abortTransaction();
      throw new Error(err);
    } finally {
      session.endSession();
    }
  },
  // As a lender, I want to update descriptive data about the loan, so that it stays current.
  // As a lender, I want to update the loan interest rate, so that it reflects current market conditions and future interests will be calculated based on the new interest rate.
  // As a lender, I want to add notes to the loan, so that I can track agreements.
  // As a lender, I want to change and delete notes, so that I can make them accurate.
  edit: async function editLoanInfo({
    userId,
    loanId,
    name,
    description,
    closesTimestamp,
  }: {
    userId: string;
    loanId: string;
    name?: string;
    description?: string;
    closesTimestamp?: number;
  }): Promise<ILoan> {
    // Check if user exists
    User.checkIfExists(userId);

    // Check if loan exists
    this.checkIfExists(loanId);

    // Get loan
    const loan: ILoanDocument = await LoanModel.findOne({ _id: loanId });

    const newInfo: Partial<Pick<ILoan, 'name' | 'description' | 'closesTimestamp'>> = {};
    if (name !== undefined) {
      newInfo.name = loanHelpers.validate.name(name);
      newInfo.name = loanHelpers.sanitize.name(newInfo.name);
    }
    if (description !== undefined) {
      newInfo.description = loanHelpers.validate.description(description);
      newInfo.description = loanHelpers.sanitize.description(newInfo.description);
    }
    if (closesTimestamp !== undefined) {
      newInfo.closesTimestamp = loanHelpers.validate.closesTimestamp(closesTimestamp);
    }
    loan.set(newInfo);

    const changedloan: ILoan = loanHelpers.runtimeCast({
      ...loan.toObject(),
      _id: loan._id.toString(),
      userId: loan.userId.toString(),
    });
    await loan.save();
    return changedloan;
  },
  checkIfExists: async function checkIfLoanExists(loanId: string, session?: ClientSession): Promise<void> {
    if (!(await LoanModel.existsOneWithId(loanId, session))) throw new Error('Loan with prodived _id does not exist!');
  },
  getOneFromUser: async function getLoan(
    {
      userId,
      loanId,
    }: {
      userId: string;
      loanId: string;
    },
    { session = undefined }: { session?: ClientSession } = {},
  ): Promise<ILoan> {
    if (LoanCache.getCachedItem({ itemId: loanId })) {
      return LoanCache.getCachedItem({ itemId: loanId }) as ILoan;
    } else {
      const MONGO_LOAN = await LoanModel.findOne({ _id: loanId, userId: userId }).session(session);
      if (MONGO_LOAN === null) throw new Error('Loan could not be found');
      const recalculatedLoan = await this.recalculateCalculatedValues(MONGO_LOAN);
      return recalculatedLoan;
    }
  },
  getFromUser: async function getLoans(
    { userId, loanId, status }: { userId: string; loanId?: string; status?: ILoan['status'][] },
    { session = undefined }: { session?: ClientSession } = {},
  ): Promise<ILoan[]> {
    if (userId === undefined) throw new Error('userId is required!');
    const query: any = {
      userId: userId,
      status: { $in: status || ['ACTIVE', 'PAID', 'PAUSED', 'COMPLETED', 'DEFAULTED'] },
    };
    if (loanId !== undefined) query._id = loanId;

    const LOANS = await LoanModel.find(query).session(session).exec();
    const returnValue: ILoan[] = [];
    for (let i = 0; i < LOANS.length; i++) {
      const LOAN_ID = LOANS[i]._id.toString();
      if (LOANS[i].status === 'COMPLETED' || LOANS[i].status === 'DEFAULTED') {
        returnValue.push(LOANS[i]);
      } else if (LoanCache.getCachedItem({ itemId: LOAN_ID })) {
        returnValue.push(LoanCache.getCachedItem({ itemId: LOAN_ID }) as ILoan);
      } else {
        const recalculatedLoan = await this.recalculateCalculatedValues(LOANS[i]);
        returnValue.push(recalculatedLoan);
      }
    }
    return returnValue;
  },

  changeInterestRate: async function changeLoanInterestRate(): Promise<void> {
    //TODO
    throw new Error('changeInterestRate not implemented!');
  },
  // As a lender, I want to view information and transactions of the specific loan, so that I can make informed decisions.
  // As a lender, I want to search for loan transactions, so that I can find the specific transaction.
  getTransactions: async function getLoanTransactions(
    loanId: string,
    paginate: { pageNumber: number; pageSize: number },
  ): Promise<ITransaction[]> {
    return await transaction.findTranasactionsFromAndTo(
      {
        addressId: loanId,
        datatype: 'LOAN',
      },
      paginate,
    );
  },
  addPayment: async function addLoanPayment(
    {
      userId,
      loanId,
      budgetId,
      transactionTimestamp,
      description,
      amount,
    }: {
      userId: string;
      loanId: string;
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
    // Validate and sanitize inputs
    transactionHelpers.validate.description(description);
    description = transactionHelpers.sanitize.description(description);
    transactionHelpers.validate.amount(amount);
    transactionHelpers.validate.transactionTimestamp(transactionTimestamp);

    // TODO FIX / HANDLE SOMEWHERE ELSE
    /*if (transactionTimestamp < MONGO_LOAN.openedTimestamp)
      throw new Error('Transaction should not happen before loan start');
    if (transactionTimestamp > new Date().getTime()) throw new Error('Transaction should not happen in the future');
*/
    const NEW_TRANSACTION = await transaction.add(
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
        entryTimestamp: transactionHelpers.validate.entryTimestamp(new Date().getTime()),
      } as Pick<
        ITransaction,
        'userId' | 'transactionTimestamp' | 'description' | 'from' | 'to' | 'amount' | 'entryTimestamp'
      >,
      { session: session },
    );

    if (runRecalculate) {
      await Budget.recalculateCalculatedValues(budgetId);
      await this.recalculateCalculatedValues(loanId);
    }
    return NEW_TRANSACTION;
  },

  addFunds: async function addFundsToLoan(
    {
      userId,
      budgetId,
      loanId,
      transactionTimestamp,
      description,
      amount,
    }: {
      userId: string;
      budgetId: string;
      loanId: string;
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
    transactionHelpers.validate.description(description);
    description = transactionHelpers.sanitize.description(description);
    transactionHelpers.validate.amount(amount);

    const NEW_TRANSACTION = await transaction.add(
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
        entryTimestamp: transactionHelpers.validate.entryTimestamp(new Date().getTime()),
      } as Pick<
        ITransaction,
        'userId' | 'transactionTimestamp' | 'description' | 'from' | 'to' | 'amount' | 'entryTimestamp'
      >,
      { session: session },
    );

    if (runRecalculate) {
      await Budget.recalculateCalculatedValues(budgetId);
      await this.recalculateCalculatedValues(loanId);
    }
    return NEW_TRANSACTION;
  },

  addManualInterest: async function addManualInterestToLoan(
    {
      userId,
      loanId,
      transactionTimestamp,
      description,
      amount,
    }: {
      userId: string;
      loanId: string;
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
    transactionHelpers.validate.transactionTimestamp(transactionTimestamp);
    transactionHelpers.validate.description(description);
    description = transactionHelpers.sanitize.description(description);
    transactionHelpers.validate.amount(amount);

    const NEW_TRANSACTION = await transaction.add(
      {
        userId: userId,
        transactionTimestamp: transactionTimestamp,
        description: description,
        from: {
          datatype: 'INTEREST',
          addressId: '000000000000000000000000',
        },
        to: {
          datatype: 'LOAN',
          addressId: loanId,
        },
        amount: amount,
        entryTimestamp: transactionHelpers.validate.entryTimestamp(new Date().getTime()),
      } as Pick<
        ITransaction,
        'userId' | 'transactionTimestamp' | 'description' | 'from' | 'to' | 'amount' | 'entryTimestamp'
      >,
      { session: session },
    );

    if (runRecalculate) {
      await this.recalculateCalculatedValues(loanId);
    }
    return NEW_TRANSACTION;
  },
  addNote: async function addNoteToLoan({ loanId, content }: { loanId: string; content: string }): Promise<ILoan> {
    await this.checkIfExists(loanId);
    const newNote: INote = {
      _id: new mongoose.Types.ObjectId().toString(),
      content: content,
      entryTimestamp: new Date().getTime(),
    };
    noteHelpers.validate.all(newNote);
    noteHelpers.sanitize.all(newNote);

    const MONGO_LOAN: ILoanDocument = await LoanModel.findOne({ _id: loanId });

    MONGO_LOAN.notes.push(newNote);

    const changedloan: ILoan = loanHelpers.runtimeCast({
      ...MONGO_LOAN.toObject(),
      _id: MONGO_LOAN._id.toString(),
      userId: MONGO_LOAN.userId.toString(),
    });
    await MONGO_LOAN.save();
    return changedloan;
  },
  editNote: async function editNoteToLoan({
    loanId,
    noteId,
    content,
  }: {
    loanId: string;
    noteId: string;
    content: string;
  }): Promise<ILoan> {
    await this.checkIfExists(loanId);

    const MONGO_LOAN: ILoanDocument = await LoanModel.findOne({ _id: loanId });

    for (let i = 0; i < MONGO_LOAN.notes.length; i++) {
      if (MONGO_LOAN.notes[i]._id === noteId) {
        const newNote: INote = {
          _id: MONGO_LOAN.notes[i]._id,
          content: content,
          entryTimestamp: new Date().getTime(),
          revisions: MONGO_LOAN.notes[i],
        };
        noteHelpers.validate.all(newNote);
        noteHelpers.sanitize.all(newNote);
      }
    }

    const changedloan: ILoan = loanHelpers.runtimeCast({
      ...MONGO_LOAN.toObject(),
      _id: MONGO_LOAN._id.toString(),
      userId: MONGO_LOAN.userId.toString(),
    });
    await MONGO_LOAN.save();
    return changedloan;
  },
  deleteNote: async function deleteNoteFromLoan({
    loanId,
    noteId,
  }: {
    loanId: string;
    noteId: string;
  }): Promise<ILoan> {
    await this.checkIfExists(loanId);

    const MONGO_LOAN: ILoanDocument = await LoanModel.findOne({ _id: loanId });

    _.remove(MONGO_LOAN.notes, function (currentObject) {
      return currentObject._id === noteId;
    });

    const changedloan: ILoan = loanHelpers.runtimeCast({
      ...MONGO_LOAN.toObject(),
      _id: MONGO_LOAN._id.toString(),
      userId: MONGO_LOAN.userId.toString(),
    });
    await MONGO_LOAN.save();
    return changedloan;
  },

  // As a lender, I want to change the status of the loan, so that status reflects the real world.
  changeStatus: async function changeLoanStatus(
    userId: string,
    loanId: string,
    newStatus: ILoan['status'],
  ): Promise<ILoan> {
    // Validate function inputs
    loanHelpers.validate.status(newStatus);

    // Check if user exists
    await User.checkIfExists(userId);

    // Check if loan exists
    await this.checkIfExists(loanId);

    // Get loan
    const loan: ILoanDocument = await LoanModel.findOne({ _id: loanId });

    // TODO : dirty fix is used to cast into loan.status
    loan.status = newStatus;
    const changedloan: ILoan = loanHelpers.runtimeCast({
      ...loan.toObject(),
      _id: loan._id.toString(),
      userId: loan.userId.toString(),
    });
    await loan.save();
    return changedloan;
  },
  pause: async function pauseLoan(input: string | ILoanDocument): Promise<ILoan> {
    const MONGO_LOAN = typeof input === 'string' ? await LoanModel.findOne({ _id: input }) : input;

    if (MONGO_LOAN.status !== 'ACTIVE') throw new Error('Only ACTIVE loans can be paused!');

    MONGO_LOAN.status = 'PAUSED';

    await MONGO_LOAN.save();
    return await this.recalculateCalculatedValues(MONGO_LOAN);
  },
  unpause: async function pauseLoan(input: string | ILoanDocument): Promise<ILoan> {
    const MONGO_LOAN = typeof input === 'string' ? await LoanModel.findOne({ _id: input }) : input;

    if (MONGO_LOAN.status !== 'PAUSED') throw new Error('Only PAUSED loans can be unpaused!');

    MONGO_LOAN.status = 'ACTIVE';

    await MONGO_LOAN.save();
    return await this.recalculateCalculatedValues(MONGO_LOAN);
  },
  complete: async function completeLoan(input: string | ILoanDocument): Promise<ILoan> {
    const MONGO_LOAN = typeof input === 'string' ? await LoanModel.findOne({ _id: input }) : input;

    // recalculate values just in case
    await this.recalculateCalculatedValues(MONGO_LOAN);
    if (MONGO_LOAN.status !== 'PAID') throw new Error('Only PAID loans can be COMPLETED!');
    const CALCULATED_VALES = await this.getCalculatedValuesAtTimestamp({
      loanId: MONGO_LOAN._id.toString(),
      interestRate: MONGO_LOAN.interestRate,
      timestampLimit: MONGO_LOAN.calculatedLastTransactionTimestamp,
    });

    // Just in case recheck if loan is actualy paid at the time of last transaction
    if (
      _.round(CALCULATED_VALES.calculatedInvestedAmount, 2) !==
      _.round(CALCULATED_VALES.calculatedTotalPaidPrincipal, 2)
    )
      throw new Error('Loan can not be closed if it is not balanced.');

    MONGO_LOAN.status = 'COMPLETED';
    MONGO_LOAN.calculatedInvestedAmount = CALCULATED_VALES.calculatedInvestedAmount;
    MONGO_LOAN.calculatedLastTransactionTimestamp = CALCULATED_VALES.calculatedLastTransactionTimestamp;
    MONGO_LOAN.calculatedOutstandingInterest = CALCULATED_VALES.calculatedOutstandingInterest;
    MONGO_LOAN.calculatedPaidInterest = CALCULATED_VALES.calculatedPaidInterest;
    MONGO_LOAN.calculatedRelatedBudgets = CALCULATED_VALES.calculatedRelatedBudgets;
    MONGO_LOAN.calculatedTotalPaidPrincipal = CALCULATED_VALES.calculatedTotalPaidPrincipal;
    MONGO_LOAN.transactionList = CALCULATED_VALES.transactionList;

    const CHANGED_LOAN = loanHelpers.runtimeCast({
      ...MONGO_LOAN.toObject(),
      _id: MONGO_LOAN._id.toString(),
      userId: MONGO_LOAN.userId.toString(),
    });
    await MONGO_LOAN.save();
    return CHANGED_LOAN;
  },
  default: async function defaultLoan(input: string | ILoanDocument): Promise<ILoan> {
    const MONGO_LOAN = typeof input === 'string' ? await LoanModel.findOne({ _id: input }) : input;

    if (MONGO_LOAN.status !== 'PAID' && MONGO_LOAN.status !== 'COMPLETED' && MONGO_LOAN.status !== 'DEFAULTED')
      throw new Error('Only PAID loans can be COMPLETED!');
    const CALCULATED_VALES = await this.getCalculatedValuesAtTimestamp({
      loanId: MONGO_LOAN._id.toString(),
      interestRate: MONGO_LOAN.interestRate,
      timestampLimit: new Date().getTime(),
    });

    MONGO_LOAN.status = 'DEFAULTED';
    MONGO_LOAN.calculatedInvestedAmount = CALCULATED_VALES.calculatedInvestedAmount;
    MONGO_LOAN.calculatedLastTransactionTimestamp = CALCULATED_VALES.calculatedLastTransactionTimestamp;
    MONGO_LOAN.calculatedOutstandingInterest = CALCULATED_VALES.calculatedOutstandingInterest;
    MONGO_LOAN.calculatedPaidInterest = CALCULATED_VALES.calculatedPaidInterest;
    MONGO_LOAN.calculatedRelatedBudgets = CALCULATED_VALES.calculatedRelatedBudgets;
    MONGO_LOAN.calculatedTotalPaidPrincipal = CALCULATED_VALES.calculatedTotalPaidPrincipal;
    MONGO_LOAN.transactionList = CALCULATED_VALES.transactionList;

    const CHANGED_LOAN = loanHelpers.runtimeCast({
      ...MONGO_LOAN.toObject(),
      _id: MONGO_LOAN._id.toString(),
      userId: MONGO_LOAN.userId.toString(),
    });
    await MONGO_LOAN.save();
    return CHANGED_LOAN;
  },
  getCalculatedValuesAtTimestamp: async function getLoanCalculatedValuesAtTimestamp({
    loanId,
    interestRate,
    timestampLimit,
  }: {
    loanId: string;
    interestRate: IInterestRate;
    timestampLimit: number;
  }): Promise<
    Pick<
      ILoan,
      | 'calculatedInvestedAmount'
      | 'calculatedTotalPaidPrincipal'
      | 'calculatedOutstandingInterest'
      | 'calculatedPaidInterest'
      | 'calculatedLastTransactionTimestamp'
      | 'calculatedRelatedBudgets'
      | 'transactionList'
    >
  > {
    let calculatedInvestedAmount = 0;
    let calculatedTotalPaidPrincipal = 0;
    let calculatedOutstandingInterest = 0;
    let calculatedPaidInterest = 0;
    let calculatedLastTransactionTimestamp = 0;
    const calculatedRelatedBudgets = {};
    // get all transactions
    const loanTransactions: ITransaction[] = await this.getTransactions(loanId, {
      pageNumber: 0,
      pageSize: Infinity,
    });

    if (loanTransactions.length > 0) calculatedLastTransactionTimestamp = loanTransactions[0].transactionTimestamp;

    loanTransactions.forEach((transaction) => {
      if (transaction.from.datatype === 'BUDGET') {
        if (calculatedRelatedBudgets[transaction.from.addressId] === undefined)
          calculatedRelatedBudgets[transaction.from.addressId] = { invested: 0, withdrawn: 0 };
        calculatedRelatedBudgets[transaction.from.addressId].invested =
          calculatedRelatedBudgets[transaction.from.addressId].invested + transaction.amount;
      }
      if (transaction.to.datatype === 'BUDGET') {
        if (calculatedRelatedBudgets[transaction.to.addressId] === undefined)
          calculatedRelatedBudgets[transaction.to.addressId] = { invested: 0, withdrawn: 0 };
        calculatedRelatedBudgets[transaction.to.addressId].withdrawn =
          calculatedRelatedBudgets[transaction.to.addressId].withdrawn + transaction.amount;
      }
    });

    const TRANSACTIONS_LIST: ITransactionInterval[] = this.generateTransactionsList({
      loanTransactions: loanTransactions,
      interestRate: interestRate,
      timestampLimit: timestampLimit,
    });
    if (TRANSACTIONS_LIST.length > 0) {
      calculatedInvestedAmount = TRANSACTIONS_LIST[TRANSACTIONS_LIST.length - 1].totalInvested;
      calculatedOutstandingInterest = TRANSACTIONS_LIST[TRANSACTIONS_LIST.length - 1].outstandingInterest;
      calculatedPaidInterest = TRANSACTIONS_LIST[TRANSACTIONS_LIST.length - 1].totalPaidInterest;
      calculatedTotalPaidPrincipal = TRANSACTIONS_LIST[TRANSACTIONS_LIST.length - 1].totalPaidPrincipal;
    }
    return {
      calculatedInvestedAmount,
      calculatedOutstandingInterest,
      calculatedPaidInterest,
      calculatedTotalPaidPrincipal,
      calculatedLastTransactionTimestamp,
      calculatedRelatedBudgets: Object.keys(calculatedRelatedBudgets).map((key) => {
        return {
          budgetId: key,
          invested: parseInt(calculatedRelatedBudgets[key].invested),
          withdrawn: parseInt(calculatedRelatedBudgets[key].withdrawn),
        } as IRelatedBudget;
      }),
      transactionList: TRANSACTIONS_LIST.reverse(),
    };
  },
  recalculateCalculatedValues: async function recalculateLoanCalculatedValues(
    input: string | ILoanDocument,
  ): Promise<ILoan> {
    const MONGO_LOAN = typeof input === 'string' ? await LoanModel.findOne({ _id: input }) : input;

    const NOW_TIMESTAMP = new Date().getTime();

    const CALCULATED_VALUES_UNTIL_NOW = await this.getCalculatedValuesAtTimestamp({
      loanId: MONGO_LOAN._id.toString(),
      interestRate: MONGO_LOAN.interestRate,
      timestampLimit: NOW_TIMESTAMP,
    });

    // Check if PAID
    if (
      _.round(CALCULATED_VALUES_UNTIL_NOW.calculatedTotalPaidPrincipal, 2) >=
        _.round(CALCULATED_VALUES_UNTIL_NOW.calculatedInvestedAmount, 2) &&
      _.round(CALCULATED_VALUES_UNTIL_NOW.calculatedOutstandingInterest, 2) === 0 &&
      MONGO_LOAN.status === 'ACTIVE'
    ) {
      MONGO_LOAN.status = 'PAID';
      MONGO_LOAN.calculatedInvestedAmount = CALCULATED_VALUES_UNTIL_NOW.calculatedInvestedAmount;
      MONGO_LOAN.calculatedLastTransactionTimestamp = CALCULATED_VALUES_UNTIL_NOW.calculatedLastTransactionTimestamp;
      MONGO_LOAN.calculatedOutstandingInterest = CALCULATED_VALUES_UNTIL_NOW.calculatedOutstandingInterest;
      MONGO_LOAN.calculatedPaidInterest = CALCULATED_VALUES_UNTIL_NOW.calculatedPaidInterest;
      MONGO_LOAN.calculatedRelatedBudgets = CALCULATED_VALUES_UNTIL_NOW.calculatedRelatedBudgets;
      MONGO_LOAN.calculatedTotalPaidPrincipal = CALCULATED_VALUES_UNTIL_NOW.calculatedTotalPaidPrincipal;
      MONGO_LOAN.transactionList = CALCULATED_VALUES_UNTIL_NOW.transactionList;
      await MONGO_LOAN.save();
    } else if (
      _.round(CALCULATED_VALUES_UNTIL_NOW.calculatedTotalPaidPrincipal, 2) <
        _.round(CALCULATED_VALUES_UNTIL_NOW.calculatedInvestedAmount, 2) ||
      (_.round(CALCULATED_VALUES_UNTIL_NOW.calculatedOutstandingInterest, 2) > 0 && MONGO_LOAN.status === 'PAID')
    ) {
      MONGO_LOAN.status = 'ACTIVE';
      await MONGO_LOAN.save();
    }

    const CHANGED_LOAN = loanHelpers.runtimeCast({
      ...MONGO_LOAN.toObject(),
      ...CALCULATED_VALUES_UNTIL_NOW,
      _id: MONGO_LOAN._id.toString(),
      userId: MONGO_LOAN.userId.toString(),
    });

    LoanCache.setCachedItem({
      itemId: MONGO_LOAN._id.toString(),
      value: {
        ...CHANGED_LOAN,
        ...CALCULATED_VALUES_UNTIL_NOW,
      },
    });

    // Saved in recalculateStatus  await MONGO_LOAN.save();
    return {
      ...CHANGED_LOAN,
      ...CALCULATED_VALUES_UNTIL_NOW,
    };
  },
  generateTransactionsList: function generateLoanTransactionsList({
    loanTransactions,
    interestRate,
    timestampLimit,
  }: {
    loanTransactions: ITransaction[];
    interestRate: IInterestRate;
    timestampLimit: number | undefined;
  }): ITransactionInterval[] {
    if (timestampLimit === undefined) timestampLimit = new Date().getTime();
    // return empty if no transactions are present in loan
    if (loanTransactions.length === 0) return [];

    // get loanId
    let loanId = '';
    if (loanTransactions[0].to.datatype === 'LOAN') loanId = loanTransactions[0].to.addressId;
    else if (loanTransactions[0].from.datatype === 'LOAN') loanId = loanTransactions[0].from.addressId;
    else throw new Error('Transaction does not include LOAN datatype');

    // check if loanTransactions are in correct order (transactionTimestamp from newest to oldest)
    for (let i = 1; i < loanTransactions.length - 1; i++) {
      if (loanTransactions[i].transactionTimestamp < loanTransactions[i + 1].transactionTimestamp)
        throw new Error('Transactions are not passed in correct order');
    }

    const IS_FIXED_AMOUNT_INTEREST =
      interestRate.duration === 'FULL_DURATION' && interestRate.type === 'FIXED_PER_DURATION';

    let interest_per_day = 0;
    let interest_per_hour = 0;
    let interest_percentage_per_hour = 0;

    if (!IS_FIXED_AMOUNT_INTEREST) {
      interest_per_day = normalizeInterestRateToDay(interestRate);
      interest_per_hour = interest_per_day / 24;
      interest_percentage_per_hour = interest_per_hour / 100;
    }
    /* 
    // get all changes to interestRate
    const loanInterestRates = [loan.interestRate];

    let revisionOfInterestRate = loan.interestRate.revisions;
    while (revisionOfInterestRate !== undefined) {
      revisionOfInterestRate = loan.interestRate.revisions;
      loanInterestRates.push(revisionOfInterestRate);
      revisionOfInterestRate = revisionOfInterestRate.revisions;
    }
    */

    // add fixed amount interest to loan
    if (IS_FIXED_AMOUNT_INTEREST) {
      loanTransactions.push({
        _id: '',
        userId: '',
        transactionTimestamp: loanTransactions[loanTransactions.length - 1].transactionTimestamp,
        description: 'fixed-interest',
        from: {
          datatype: 'INTEREST',
          addressId: '',
        },
        to: {
          datatype: 'LOAN',
          addressId: loanId,
        },
        amount: interestRate.amount,
        entryTimestamp: loanTransactions[loanTransactions.length - 1].transactionTimestamp + 1, // Add fixed interest after first transaction
      });
    }

    // add another empty loan transaction in order to calculate interes
    // Not ideal solution as frontend has to ignore it, but its simple...
    // POSSIBLE SOURCE OF BUGS IS DATA STRUCTURE IS CHANGED
    if (loanTransactions[0].transactionTimestamp < timestampLimit)
      loanTransactions.unshift({
        _id: '',
        userId: '',
        transactionTimestamp: timestampLimit,
        description: '',
        from: { datatype: 'OUTSIDE', addressId: '' },
        to: { datatype: 'OUTSIDE', addressId: '' },
        amount: 0,
        entryTimestamp: timestampLimit,
      });

    const listOfTransactions: ITransactionInterval[] = [];

    let totalInvested = 0;
    let totalPaidPrincipal = 0;
    let totalPaidInterest = 0;
    let outstandingPrincipal = 0;
    let outstandingInterest = 0;
    for (let i = loanTransactions.length - 1; i >= 0; i--) {
      const loanTransaction = loanTransactions[i];

      const transactionInformation: Pick<
        ITransactionInterval,
        | 'id'
        | 'timestamp'
        | 'description'
        | 'from'
        | 'to'
        | 'invested'
        | 'interestCharged'
        | 'feeCharged'
        | 'principalPaid'
        | 'interestPaid'
      > = {
        id: loanTransaction._id.toString(),
        timestamp: loanTransaction.transactionTimestamp,
        description: loanTransaction.description,
        from: loanTransaction.from,
        to: loanTransaction.to,
        invested: 0,
        feeCharged: 0,
        interestCharged: 0,
        principalPaid: 0,
        interestPaid: 0,
      };

      //
      let fromDateTimestamp;
      const toDateTimestamp = loanTransaction.transactionTimestamp;
      //if first iteration
      if (i === loanTransactions.length - 1) {
        fromDateTimestamp = loanTransaction.transactionTimestamp;
      } else {
        fromDateTimestamp = loanTransactions[i + 1].transactionTimestamp;
      }
      // for calculating interest daily const differenceInDays = differenceInCalendarDays(new Date(toDateTimestamp), new Date(fromDateTimestamp));
      const DIFFERENCE_IN_HOURS = differenceInHours(new Date(toDateTimestamp), new Date(fromDateTimestamp));

      /**
       * If outstandingPrincipal is 0 or less
       * then interestCharged should is not charged
       * to prevent negative interest (interest to loaner)
       */
      if (!IS_FIXED_AMOUNT_INTEREST && outstandingPrincipal > 0) {
        if (interestRate.type === 'PERCENTAGE_PER_DURATION' && interestRate.isCompounding) {
          for (let i = 0; i < DIFFERENCE_IN_HOURS; i++) {
            transactionInformation.interestCharged +=
              (outstandingPrincipal + transactionInformation.interestCharged) * interest_percentage_per_hour;
          }
        } else if (interestRate.type === 'PERCENTAGE_PER_DURATION' && !interestRate.isCompounding) {
          transactionInformation.interestCharged =
            outstandingPrincipal * interest_percentage_per_hour * DIFFERENCE_IN_HOURS;
        } else if (interestRate.type === 'FIXED_PER_DURATION' && interestRate.duration !== 'FULL_DURATION') {
          transactionInformation.interestCharged = interest_per_hour * DIFFERENCE_IN_HOURS;
        }
        outstandingInterest += transactionInformation.interestCharged;
      }
      // calculate principal payment and next outstandingPrincipal
      if (loanTransaction.from.datatype === 'BUDGET') {
        transactionInformation.invested = loanTransaction.amount;
        totalInvested += loanTransaction.amount;
        outstandingPrincipal += loanTransaction.amount;
      } else if (loanTransaction.from.datatype === 'INTEREST') {
        if (outstandingPrincipal < 0 && -outstandingPrincipal < loanTransaction.amount) {
          transactionInformation.feeCharged = loanTransaction.amount;
          totalPaidPrincipal += outstandingPrincipal;
          outstandingInterest += loanTransaction.amount + outstandingPrincipal;
          outstandingPrincipal = 0;
        } else if (outstandingPrincipal < 0 && -outstandingPrincipal >= loanTransaction.amount) {
          transactionInformation.feeCharged = loanTransaction.amount;
          totalPaidPrincipal += outstandingPrincipal;
          outstandingPrincipal = outstandingPrincipal + loanTransaction.amount;
          outstandingInterest = 0;
        } else {
          transactionInformation.feeCharged = loanTransaction.amount;
          outstandingInterest += loanTransaction.amount;
        }
      } else if (loanTransaction.from.datatype === 'LOAN') {
        if (loanTransaction.amount <= outstandingInterest) {
          transactionInformation.interestPaid = loanTransaction.amount;
          outstandingInterest -= loanTransaction.amount;
          totalPaidInterest += loanTransaction.amount;
        } else {
          transactionInformation.interestPaid = outstandingInterest;
          totalPaidInterest += outstandingInterest;
          transactionInformation.principalPaid = loanTransaction.amount - outstandingInterest;
          totalPaidPrincipal += transactionInformation.principalPaid;
          outstandingInterest = 0;
          outstandingPrincipal -= transactionInformation.principalPaid;
        }
      }

      /**
       * If transaction is causing loan principal to be paid withing 2 decimals
       * then outstanding values should be set to 0
       * to prevent further calculation of interest and interest on interest,
       * in case when user does not complete paid loan in reasonable timeframe.
       **/
      if (_.round(outstandingPrincipal, 2) <= 0 && _.round(outstandingInterest, 2) === 0) {
        outstandingInterest = 0;
      }

      listOfTransactions.push({
        ...transactionInformation,
        totalInvested: totalInvested,
        totalPaidPrincipal: totalPaidPrincipal,
        totalPaidInterest: totalPaidInterest,
        outstandingPrincipal: outstandingPrincipal,
        outstandingInterest: outstandingInterest,
      });
    }
    return listOfTransactions;
  },

  // TODO NOT WORKING...
  calculateExpetedAmortization: async function calculateExpectedLoanAmortization({
    openedTimestamp,
    closesTimestamp,
    interestRate,
    amount,
  }: {
    openedTimestamp: number;
    closesTimestamp: number;
    interestRate: Omit<IInterestRate, 'entryTimestamp' | 'revisions'>;
    amount: number;
  }): Promise<IAmortizationInterval[]> {
    // TODO: validate inputs

    const paydaysTimestamps: number[] = getTimestampsOfPaydays({
      openedTimestamp: openedTimestamp,
      closesTimestamp: closesTimestamp,
      expectedPayments: interestRate.expectedPayments,
    });
    const loanDurationInDays = differenceInCalendarDays(new Date(closesTimestamp), new Date(openedTimestamp)) + 1;

    const interestPerDay = normalizeInterestRateToDay(interestRate);
    const interestPercentagePerDay = interestPerDay / 100;
    const paymentPerDay = calculateLoanPaymentAmount(amount, interestPercentagePerDay, loanDurationInDays);
    console.log(paymentPerDay);

    let paymentPerDuration: number;
    switch (interestRate.expectedPayments) {
      case 'DAILY':
        paymentPerDuration = paymentPerDay;
        break;
      case 'WEEKLY':
        paymentPerDuration = paymentPerDay * 7;
        break;
      case 'MONTHLY':
        paymentPerDuration = paymentPerDay * 30;
        break;
      case 'YEARLY':
        paymentPerDuration = paymentPerDay * 365;
        break;
      case 'ONE_TIME':
        paymentPerDuration = paymentPerDay * loanDurationInDays;
        break;
    }

    const listOfPayments: IAmortizationInterval[] = [];
    for (let i = 0; i < paydaysTimestamps.length; i++) {
      let outstandingPrincipal;
      let fromDateTimestamp;
      if (i === 0) {
        outstandingPrincipal = amount;
        fromDateTimestamp = openedTimestamp;
      } else {
        outstandingPrincipal = listOfPayments[i - 1].outstandingPrincipal - listOfPayments[i - 1].principalPayment;
        fromDateTimestamp = paydaysTimestamps[i - 1];
      }

      const toDateTimestamp = paydaysTimestamps[i];

      const differenceInDays = differenceInCalendarDays(new Date(toDateTimestamp), new Date(fromDateTimestamp));

      // const paymentAmount = differenceInDays * paymentPerDay;
      let interest = 0;
      if (interestRate.type === 'PERCENTAGE_PER_DURATION' && interestRate.isCompounding) {
        for (let i = 0; i < differenceInDays; i++) {
          interest += (outstandingPrincipal + interest) * interestPercentagePerDay;
        }
      } else if (interestRate.type === 'PERCENTAGE_PER_DURATION' && !interestRate.isCompounding) {
        interest = outstandingPrincipal * interestPercentagePerDay * differenceInDays;
      } else if (interestRate.type === 'FIXED_PER_DURATION' && interestRate.duration !== 'FULL_DURATION') {
        interest = interestPerDay * differenceInDays;
      } /* else if (interestRate.type === 'FIXED_PER_DURATION' && interestRate.duration === 'FULL_DURATION') {
        interest = interestRate.amount / loanDurationInDays;
      } */

      listOfPayments.push({
        fromDateTimestamp: fromDateTimestamp,
        toDateTimestamp: toDateTimestamp,
        outstandingPrincipal: outstandingPrincipal,
        interest: interest,
        principalPayment: paymentPerDuration - interest,
        //principalPayment: differenceInDays * principalPaymentPerDay,
      });
    }

    // get amount of durations between fromDate and toDate
    // multiply durations by interestRate.Amount
    return listOfPayments;
  },
  // As a lender, I want to export loan data and transactions, so that I can archive them or import them to other software.
  export: function joinLoanTransactionsIntoAccountingTable(): void {
    // TODO
  },
};

function getTimestampsOfPaydays({
  openedTimestamp,
  closesTimestamp,
  expectedPayments,
}: {
  openedTimestamp: number;
  closesTimestamp: number;
  expectedPayments: IInterestRate['expectedPayments'];
}): number[] {
  let paymentDaysTimestamps: number[] = [];

  if (expectedPayments === 'DAILY') {
    paymentDaysTimestamps = eachDayOfInterval({
      start: openedTimestamp,
      end: closesTimestamp,
    }).map((date) => {
      return date.getTime();
    });
    paymentDaysTimestamps.shift();
  } else if (expectedPayments === 'WEEKLY') {
    paymentDaysTimestamps = eachWeekOfInterval({
      start: openedTimestamp,
      end: closesTimestamp,
    }).map((date) => {
      return date.getTime();
    });
    paymentDaysTimestamps.shift();
    if (paymentDaysTimestamps[paymentDaysTimestamps.length - 1] !== closesTimestamp) {
      paymentDaysTimestamps.push(closesTimestamp);
    }
  } else if (expectedPayments === 'MONTHLY') {
    paymentDaysTimestamps = eachMonthOfInterval({
      start: openedTimestamp,
      end: closesTimestamp,
    }).map((date) => {
      return date.getTime();
    });
    paymentDaysTimestamps.shift();
    if (paymentDaysTimestamps[paymentDaysTimestamps.length - 1] !== closesTimestamp) {
      paymentDaysTimestamps.push(closesTimestamp);
    }
  } else if (expectedPayments === 'YEARLY') {
    paymentDaysTimestamps = eachYearOfInterval({
      start: openedTimestamp,
      end: closesTimestamp,
    }).map((date) => {
      return date.getTime();
    });
    paymentDaysTimestamps.shift();
    if (paymentDaysTimestamps[paymentDaysTimestamps.length - 1] !== closesTimestamp) {
      paymentDaysTimestamps.push(closesTimestamp);
    }
  } else if (expectedPayments === 'ONE_TIME') {
    paymentDaysTimestamps.push(closesTimestamp);
  }
  return paymentDaysTimestamps;
}
function normalizeInterestRateToDay(interestRate: Omit<IInterestRate, 'entryTimestamp' | 'revisions'>): number {
  if (interestRate.duration === 'DAY') {
    return interestRate.amount;
  } else if (interestRate.duration === 'WEEK') {
    return interestRate.amount / 7;
  } else if (interestRate.duration === 'MONTH') {
    return interestRate.amount / 30;
  } else if (interestRate.duration === 'YEAR') {
    return interestRate.amount / 365;
  } else {
    throw new Error('Error when calculating daily interest rate!');
  }
}

/**
 * Calculates amount that has to be paid for each loan payment.
 * @param  {number} LOAN_AMOUNT - Is positive amount of loan given (without the interest)
 * @param  {number} INTEREST_PERCENTAGE_PER_PAYMENT - Is positive percentage of interest per payment.
 * For example: If yearly interest rate is 5% and there are 12 payments in a year,
 * then INTEREST_PERCENTAGE_PER_PAYMENT is (5 / 12) / 100.
 * Note: If loan is compounding then interest rate should be adjusted to Equivalent Interest Rate (https://www.calculatorsoup.com/calculators/financial/equivalent-interest-rate-calculator.php)
 * @param  {number} NUMBER_OF_PAYMENTS - Represents a positive total number of payments in whole loan duration.
 * @returns number
 */
export function calculateLoanPaymentAmount(
  LOAN_AMOUNT: number,
  INTEREST_PERCENTAGE_PER_PAYMENT: number,
  NUMBER_OF_PAYMENTS: number,
): number {
  if (LOAN_AMOUNT <= 0) throw new Error('LOAN_AMOUNT should be greater than 0');
  if (INTEREST_PERCENTAGE_PER_PAYMENT <= 0) throw new Error('INTEREST_PERCENTAGE_PER_PAYMENT should be greater than 0');
  if (NUMBER_OF_PAYMENTS <= 0) throw new Error('NUMBER_OF_PAYMENTS should be greater than 0');

  // Link to forumula: https://www.calculatorsoup.com/calculators/financial/loan-calculator-simple.php
  return (
    (LOAN_AMOUNT * (INTEREST_PERCENTAGE_PER_PAYMENT * (1 + INTEREST_PERCENTAGE_PER_PAYMENT) ** NUMBER_OF_PAYMENTS)) /
    ((1 + INTEREST_PERCENTAGE_PER_PAYMENT) ** NUMBER_OF_PAYMENTS - 1)
  );
}

/**
 * Calculate interest rate for compounding interest rate. All params are bound to a unspecified period (ex. year or week).
 * @param  {number} INTEREST_RATE_PERCENTAGE_PER_PERIOD - Positive number of percentage in decimals (ex. 5% is 0.05)
 * @param  {number} NUMBER_OF_COMPOUNDINGS_PER_PERIOD - Positive number of compoundings.
 * For example: If period is YEAR and compounding is monthly then NUMBER_OF_COMPOUNDINGS_PER_PERIOD is 12.
 * @param  {number} NUMBER_OF_PAYMENTS_PER_PERIOD - Positive number of payments per period.
 * For example: If period is YEAR and payments are monthly then number of payments is 12.
 * @returns number
 */
export function calculateEquivalentInterestRate(
  INTEREST_RATE_PERCENTAGE_PER_PERIOD: number,
  NUMBER_OF_COMPOUNDINGS_PER_PERIOD: number,
  NUMBER_OF_PAYMENTS_PER_PERIOD: number,
): number {
  if (INTEREST_RATE_PERCENTAGE_PER_PERIOD <= 0)
    throw new Error('INTEREST_RATE_PERCENTAGE_PER_PERIOD should be greater than 0');
  if (NUMBER_OF_COMPOUNDINGS_PER_PERIOD <= 0)
    throw new Error('NUMBER_OF_COMPOUNDINGS_PER_PERIOD should be greater than 0');
  if (NUMBER_OF_PAYMENTS_PER_PERIOD <= 0) throw new Error('NUMBER_OF_PAYMENTS_PER_PERIOD should be greater than 0');

  // Link to formula and online calculator: https://www.calculatorsoup.com/calculators/financial/equivalent-interest-rate-calculator.php
  return (
    NUMBER_OF_PAYMENTS_PER_PERIOD *
    ((1 + INTEREST_RATE_PERCENTAGE_PER_PERIOD / NUMBER_OF_COMPOUNDINGS_PER_PERIOD) **
      (NUMBER_OF_COMPOUNDINGS_PER_PERIOD / NUMBER_OF_PAYMENTS_PER_PERIOD) -
      1)
  );
}
