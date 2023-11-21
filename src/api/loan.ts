import mongoose, { ClientSession } from 'mongoose';
import {
  //add,
  differenceInHours,
  //differenceInCalendarDays,
  //eachDayOfInterval,
  //eachWeekOfInterval,
  //eachMonthOfInterval,
  //eachYearOfInterval,
} from 'date-fns';
import * as User from './user.js';
import transaction from './transaction.js';
import { loanHelpers } from './types/loan/loanHelpers.js';
import { ILoan, ILoanStatus, IRelatedBudget, ITransactionInterval } from './types/loan/loanInterface.js';
import { IPaymentFrequency } from './types/paymentFrequency/paymentFrequencyInterface.js';
import { ITransaction } from './types/transaction/transactionInterface.js';
import Budget from './budget.js';
import { transactionHelpers } from './types/transaction/transactionHelpers.js';
import { IInterestRate } from './types/interestRate/interestRateInterface.js';
import LoanModel, { ILoanDocument } from './db/model/LoanModel.js';
import LoanCache from './cache/loanCache.js';
import _ from 'lodash';
import { INote } from './types/note/noteInterface.js';
import { noteHelpers } from './types/note/noteHelpers.js';
import { IUser } from './types/user/userInterface.js';
import { TokenMessage } from 'firebase-admin/messaging';
import { sendNotifications } from './utils/cloudMessaging/cloudMessaging.js';
import UserModel from './db/model/UserModel.js';
import { paymentFrequencyHelpers } from './types/paymentFrequency/paymentFrequencyHelpers.js';
import paranoidCalculator from './utils/paranoidCalculator/paranoidCalculator.js';
import { IBudget } from './types/budget/budgetInterface.js';
import { interestRateHelpers } from './types/interestRate/interestRateHelpers.js';

interface fund {
  budgetId: string;
  amount: number;
  interestRate: IInterestRate;
}

const Loan = {
  // As a lender, I want to create new loans, so that I can later track specific loan transactions and info.
  create: async function createLoan(
    userId: string,
    input: Pick<
      ILoan,
      | 'name'
      | 'description'
      | 'customerId'
      | 'openedTimestamp'
      | 'closesTimestamp'
      | 'paymentFrequency'
      | 'expectedPayments'
    >,
    funds: fund[],
    initialTransactionDescription: string,
  ): Promise<ILoan> {
    // check if user exists
    await User.checkIfExists(userId);

    const newLoanData: ILoan = loanHelpers.runtimeCast({
      _id: new mongoose.Types.ObjectId().toString(),
      userId: userId,
      name: input.name,
      description: input.description,
      customerId: input.customerId,
      notes: [],
      openedTimestamp: input.openedTimestamp,
      closesTimestamp: input.closesTimestamp,
      paymentFrequency: input.paymentFrequency,
      expectedPayments: input.expectedPayments,
      status: {
        current: 'ACTIVE',
        timestamp: input.openedTimestamp,
      },
      calculatedInvestedAmount: 0,
      calculatedOutstandingPrincipal: 0,
      calculatedTotalPaidPrincipal: 0,
      calculatedOutstandingInterest: 0,
      calculatedOutstandingFees: 0,
      calculatedPaidInterest: 0,
      calculatedPaidFees: 0,
      calculatedTotalForgiven: 0,
      calculatedTotalRefunded: 0,
      calculatedLastTransactionTimestamp: input.openedTimestamp,
      calculatedRelatedBudgets: [],
      transactionList: [],
    });

    // Do checks on inputs
    loanHelpers.validate.all(newLoanData);
    loanHelpers.sanitize.all(newLoanData);

    if (funds.length <= 0) throw new Error('Funds should be provided to new loan!');

    // check if budgets exist
    for (let i = 0; i < funds.length; i++) {
      await Budget.checkIfExists(funds[i].budgetId);
    }

    const session: ClientSession = await mongoose.connection.startSession();
    try {
      session.startTransaction();

      const Mongo_Loan: ILoanDocument = await new LoanModel(newLoanData).save({ session });

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
            interestRate: funds[i].interestRate,
            relatedBudgetId: funds[i].budgetId,
            entryTimestamp: transactionHelpers.validate.entryTimestamp(new Date().getTime()),
          },
          { session: session },
        );
      }
      const recalculatedLoan: ILoan = await this.recalculateCalculatedValues(Mongo_Loan, session);
      for (const budget of recalculatedLoan.calculatedRelatedBudgets) {
        await Budget.updateTransactionList(budget.budgetId, session);
      }
      // recalculate affected budgets
      /* should recaltulate in loan.recalculateCalculatedValues
      
      for (const fund of funds) {
        await Budget.updateTransactionList(fund.budgetId, session);
      }*/

      await session.commitTransaction();
      for (const budget of recalculatedLoan.calculatedRelatedBudgets) {
        await Budget.updateTransactionList(budget.budgetId);
      }
      return recalculatedLoan;
    } catch (err) {
      console.log(err);
      await session.abortTransaction();
      throw new Error(err.message);
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
    customerId,
  }: {
    userId: string;
    loanId: string;
    name?: string;
    description?: string;
    customerId?: string;
  }): Promise<ILoan> {
    // Get loan
    const loan: ILoanDocument = await LoanModel.findOne({ _id: loanId, userId: userId });
    if (loan === null) throw new Error('Loan does not exist!');

    const newInfo: Partial<Pick<ILoan, 'name' | 'description' | 'customerId'>> = {};
    if (name !== undefined) {
      newInfo.name = loanHelpers.validate.name(name);
      newInfo.name = loanHelpers.sanitize.name(newInfo.name);
    }
    if (description !== undefined) {
      newInfo.description = loanHelpers.validate.description(description);
      newInfo.description = loanHelpers.sanitize.description(newInfo.description);
    }
    if (customerId !== undefined) {
      newInfo.customerId = customerId;
    }
    loan.set(newInfo);

    loanHelpers.runtimeCast({
      ...loan.toObject(),
      _id: loan._id.toString(),
      userId: loan.userId.toString(),
    });
    await loan.save();
    const recalculatedLoan = await this.recalculateCalculatedValues(loan);
    for (const budget of recalculatedLoan.calculatedRelatedBudgets) {
      await Budget.updateTransactionList(budget.budgetId);
    }
    return recalculatedLoan;
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
    if (userId === undefined) throw new Error('userId is required!');
    if (loanId === undefined) throw new Error('loanId is required!');
    // if session is provided, do not use cache and don't recalculate, because such a call is a part of ongoing transaction. Changes to data will be made in the end of successful session.
    if (session !== undefined) {
      const MONGO_LOAN = await LoanModel.findOne({ _id: loanId, userId: userId }).session(session);
      if (MONGO_LOAN === null) throw new Error('Loan could not be found');
      return loanHelpers.runtimeCast({
        ...MONGO_LOAN.toObject(),
        _id: MONGO_LOAN._id.toString(),
        userId: MONGO_LOAN.userId.toString(),
      });
    }

    if (LoanCache.getCachedItem({ itemId: loanId })) {
      return LoanCache.getCachedItem({ itemId: loanId }) as ILoan;
    } else {
      const MONGO_LOAN = await LoanModel.findOne({ _id: loanId, userId: userId });
      if (MONGO_LOAN === null) throw new Error('Loan could not be found');
      // Do not recalculate if loan is completed or defaulted, because no change to data will ever be made
      if (MONGO_LOAN.status.current === 'COMPLETED' || MONGO_LOAN.status.current === 'DEFAULTED') {
        const LOAN = loanHelpers.runtimeCast({
          ...MONGO_LOAN.toObject(),
          _id: MONGO_LOAN._id.toString(),
          userId: MONGO_LOAN.userId.toString(),
        });
        LoanCache.setCachedItem({
          itemId: MONGO_LOAN._id.toString(),
          value: LOAN,
        });
        return LOAN;
      }

      const recalculatedLoan = await this.recalculateCalculatedValues(MONGO_LOAN);
      for (const budget of recalculatedLoan.calculatedRelatedBudgets) {
        await Budget.updateTransactionList(budget.budgetId);
      }
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
      'status.current': { $in: status || ['ACTIVE', 'PAID', 'PAUSED', 'COMPLETED', 'DEFAULTED'] },
    };
    if (loanId !== undefined) query._id = loanId;

    const LOANS = await LoanModel.find(query).session(session).exec();
    const returnValue: ILoan[] = [];
    const budgetsToUpdate: IBudget['_id'][] = [];
    for (let i = 0; i < LOANS.length; i++) {
      const LOAN_ID = LOANS[i]._id.toString();
      if (LoanCache.getCachedItem({ itemId: LOAN_ID })) {
        returnValue.push(LoanCache.getCachedItem({ itemId: LOAN_ID }) as ILoan);
      } else {
        // Do not recalculate if session is provided, because changes to data will be made in the end of successful session
        if (session !== undefined) {
          returnValue.push(
            loanHelpers.runtimeCast({
              ...LOANS[i].toObject(),
              _id: LOANS[i]._id.toString(),
              userId: LOANS[i].userId.toString(),
            }),
          );
          // Do not recalculate if loan is completed or defaulted, because no change to data will ever be made
        } else if (LOANS[i].status.current === 'COMPLETED' || LOANS[i].status.current === 'DEFAULTED') {
          const LOAN = loanHelpers.runtimeCast({
            ...LOANS[i].toObject(),
            _id: LOANS[i]._id.toString(),
            userId: LOANS[i].userId.toString(),
          });
          LoanCache.setCachedItem({
            itemId: LOANS[i]._id.toString(),
            value: LOAN,
          });
          returnValue.push(LOAN);
        } else {
          const recalculatedLoan = await this.recalculateCalculatedValues(LOANS[i]);
          returnValue.push(recalculatedLoan);

          // add recalculatedLoan calculatedRelatedBudgets to budgetsToUpdate if not already there
          for (const budget of recalculatedLoan.calculatedRelatedBudgets) {
            if (!budgetsToUpdate.includes(budget.budgetId)) budgetsToUpdate.push(budget.budgetId);
          }
        }
      }
    }
    for (const budgetId of budgetsToUpdate) {
      await Budget.updateTransactionList(budgetId);
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
    { session = undefined }: { session?: ClientSession } = {},
  ): Promise<ITransaction[]> {
    return await transaction.findTranasactionsFromAndTo(
      {
        addressId: loanId,
        datatype: 'LOAN',
      },
      paginate,
      { session },
    );
  },
  getBudgetInvestmentPercentageAtTimestamp: function getBudgetInvestmentPercentageAtTimestamp(
    loan: ILoan,
    budgetId,
    timestamp,
  ): number {
    // reverse transaction list without mutating original list
    //const LOAN_TRANSACTION_LIST = loan.transactionList.
    let totalInvested = 0;
    let totalInvestedByBudget = 0;
    for (let i = loan.transactionList.length - 1; i >= 0 && loan.transactionList[i].timestamp <= timestamp; i--) {
      const TRANSACTION = loan.transactionList[i];
      if (TRANSACTION.invested !== 0) {
        totalInvested = TRANSACTION.totalInvested;
        if (TRANSACTION.from.addressId === budgetId) {
          totalInvestedByBudget += TRANSACTION.invested;
        }
      }
    }
    return totalInvestedByBudget / totalInvested;
  },
  addPayment: async function addLoanPayment(
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
    // Validate and sanitize inputs
    transactionHelpers.validate.description(description);
    description = transactionHelpers.sanitize.description(description);
    transactionHelpers.validate.amount(amount);
    transactionHelpers.validate.transactionTimestamp(transactionTimestamp);

    const NEW_TRANSACTION = await transaction.add(
      {
        userId,
        transactionTimestamp,
        description,
        from: {
          datatype: 'OUTSIDE',
          addressId: '000000000000000000000000',
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
      const recalculatedLoan = await this.recalculateCalculatedValues(loanId);
      for (const budget of recalculatedLoan.calculatedRelatedBudgets) {
        await Budget.updateTransactionList(budget.budgetId, session);
      }
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
      interestRate,
      amount,
    }: {
      userId: string;
      budgetId: string;
      loanId: string;
      transactionTimestamp: number;
      description: string;
      interestRate: IInterestRate;
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
    transactionHelpers.validate.transactionTimestamp(transactionTimestamp);

    // validate interestRate
    interestRateHelpers.validate.all(interestRate);

    // validate amount
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
        interestRate: interestRate,
        relatedBudgetId: budgetId,
        entryTimestamp: transactionHelpers.validate.entryTimestamp(new Date().getTime()),
      } as Pick<
        ITransaction,
        'userId' | 'transactionTimestamp' | 'description' | 'from' | 'to' | 'amount' | 'entryTimestamp'
      >,
      { session: session },
    );

    if (runRecalculate) {
      const recalculatedLoan = await this.recalculateCalculatedValues(loanId);
      for (const budget of recalculatedLoan.calculatedRelatedBudgets) {
        await Budget.updateTransactionList(budget.budgetId, session);
      }
    }
    return NEW_TRANSACTION;
  },
  addManualInterest: async function addManualInterestToLoan(
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
        relatedBudgetId: budgetId,
        entryTimestamp: transactionHelpers.validate.entryTimestamp(new Date().getTime()),
      } as Pick<
        ITransaction,
        'userId' | 'transactionTimestamp' | 'description' | 'from' | 'to' | 'amount' | 'entryTimestamp'
      >,
      { session: session },
    );

    if (runRecalculate) {
      const recalculatedLoan = await this.recalculateCalculatedValues(loanId);
      for (const budget of recalculatedLoan.calculatedRelatedBudgets) {
        await Budget.updateTransactionList(budget.budgetId, session);
      }
    }
    return NEW_TRANSACTION;
  },
  addForgiveness: async function addLoanForgiveness(
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
          datatype: 'LOAN',
          addressId: loanId,
        },
        to: {
          datatype: 'FORGIVENESS',
          addressId: '000000000000000000000000',
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
      const recalculatedLoan = await this.recalculateCalculatedValues(loanId);
      for (const budget of recalculatedLoan.calculatedRelatedBudgets) {
        await Budget.updateTransactionList(budget.budgetId, session);
      }
    }
    return NEW_TRANSACTION;
  },
  addRefund: async function addLoanRefund(
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
          datatype: 'LOAN',
          addressId: loanId,
        },
        to: {
          datatype: 'OUTSIDE',
          addressId: '000000000000000000000000',
        },
        refund: true,
        amount: amount,
        entryTimestamp: transactionHelpers.validate.entryTimestamp(new Date().getTime()),
      } as Pick<
        ITransaction,
        'userId' | 'transactionTimestamp' | 'description' | 'from' | 'to' | 'amount' | 'entryTimestamp'
      >,
      { session: session },
    );

    if (runRecalculate) {
      const recalculatedLoan = await this.recalculateCalculatedValues(loanId);
      for (const budget of recalculatedLoan.calculatedRelatedBudgets) {
        await Budget.updateTransactionList(budget.budgetId, session);
      }
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

    MONGO_LOAN.markModified('notes');
    await MONGO_LOAN.save();
    const recalculatedLoan = await this.recalculateCalculatedValues(MONGO_LOAN);
    for (const budget of recalculatedLoan.calculatedRelatedBudgets) {
      await Budget.updateTransactionList(budget.budgetId);
    }
    return recalculatedLoan;
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
      if (MONGO_LOAN.notes[i]._id.toString() === noteId) {
        const newNote: INote = {
          _id: MONGO_LOAN.notes[i]._id,
          content: content,
          entryTimestamp: new Date().getTime(),
          revisions: MONGO_LOAN.notes[i],
        };
        noteHelpers.validate.all(newNote);
        noteHelpers.sanitize.all(newNote);
        MONGO_LOAN.notes[i] = newNote;
        break;
      }
    }

    MONGO_LOAN.markModified('notes');
    await MONGO_LOAN.save();
    const recalculatedLoan = await this.recalculateCalculatedValues(MONGO_LOAN);
    for (const budget of recalculatedLoan.calculatedRelatedBudgets) {
      await Budget.updateTransactionList(budget.budgetId);
    }
    return recalculatedLoan;
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
      return currentObject._id == noteId;
    });
    MONGO_LOAN.markModified('notes');
    await MONGO_LOAN.save();
    const recalculatedLoan = await this.recalculateCalculatedValues(MONGO_LOAN);
    for (const budget of recalculatedLoan.calculatedRelatedBudgets) {
      await Budget.updateTransactionList(budget.budgetId);
    }
    return recalculatedLoan;
  },

  // Get loan status at a given timestamp
  getStatusAtTimestamp: function getLoanStatusAtTimestamp(
    loan: ILoan,
    timestamp: number,
  ): ILoanStatus['current'] | undefined {
    if (timestamp < loan.openedTimestamp) return undefined;
    const STATUS: ILoanStatus = loan.status;
    const arrayOfStatuses = unWrapStatuses(STATUS);

    // get status that of which the timestamp is closest greater than the given timestamp
    let closestStatus: ILoanStatus = arrayOfStatuses[0];
    for (let i = 1; i < arrayOfStatuses.length; i++) {
      if (arrayOfStatuses[i].timestamp <= timestamp && arrayOfStatuses[i].timestamp > closestStatus.timestamp) {
        closestStatus = arrayOfStatuses[i];
      }
    }
    return closestStatus.current;

    function unWrapStatuses(statuses: ILoanStatus): ILoanStatus[] {
      const statusesArray: ILoanStatus[] = [];
      let unWrappedStatus: ILoanStatus = statuses;
      do {
        statusesArray.push({ current: unWrappedStatus.current, timestamp: unWrappedStatus.timestamp });
        unWrappedStatus = unWrappedStatus.previous;
      } while (unWrappedStatus !== undefined);
      return statusesArray;
    }
  },

  // As a lender, I want to change the status of the loan, so that status reflects the real world.
  changeStatus: async function changeLoanStatus(
    input: string | ILoanDocument,
    newStatus: ILoanStatus['current'],
    timestamp: number,
  ): Promise<ILoanDocument> {
    // Validate function inputs
    loanHelpers.validate.status({ current: newStatus, timestamp: timestamp });

    // Get loan
    const MONGO_LOAN = typeof input === 'string' ? await LoanModel.findOne({ _id: input }) : input;

    MONGO_LOAN.status.previous = MONGO_LOAN.status;
    MONGO_LOAN.status.current = newStatus;
    MONGO_LOAN.status.timestamp = timestamp;

    loanHelpers.runtimeCast({
      ...MONGO_LOAN.toObject(),
      _id: MONGO_LOAN._id.toString(),
      userId: MONGO_LOAN.userId.toString(),
    });
    return MONGO_LOAN;
  },
  pause: async function pauseLoan(input: string | ILoanDocument): Promise<ILoan> {
    const MONGO_LOAN = typeof input === 'string' ? await LoanModel.findOne({ _id: input }) : input;

    if (MONGO_LOAN.status.current !== 'ACTIVE') throw new Error('Only ACTIVE loans can be paused!');

    await this.changeStatus(MONGO_LOAN, 'PAUSED', Date.now());
    const recalculatedLoan = await this.recalculateCalculatedValues(MONGO_LOAN);
    for (const budget of recalculatedLoan.calculatedRelatedBudgets) {
      await Budget.updateTransactionList(budget.budgetId);
    }
    return recalculatedLoan;
  },
  unpause: async function pauseLoan(input: string | ILoanDocument): Promise<ILoan> {
    const MONGO_LOAN = typeof input === 'string' ? await LoanModel.findOne({ _id: input }) : input;

    if (MONGO_LOAN.status.current !== 'PAUSED') throw new Error('Only PAUSED loans can be unpaused!');

    await this.changeStatus(MONGO_LOAN, 'ACTIVE', Date.now());
    const recalculatedLoan = await this.recalculateCalculatedValues(MONGO_LOAN);
    for (const budget of recalculatedLoan.calculatedRelatedBudgets) {
      await Budget.updateTransactionList(budget.budgetId);
    }
    return recalculatedLoan;
  },
  complete: async function completeLoan(input: string | ILoanDocument): Promise<ILoan> {
    const MONGO_LOAN = typeof input === 'string' ? await LoanModel.findOne({ _id: input }) : input;

    // recalculate values just in case
    const recalculatedLoan = await this.recalculateCalculatedValues(MONGO_LOAN);
    for (const budget of recalculatedLoan.calculatedRelatedBudgets) {
      await Budget.updateTransactionList(budget.budgetId);
    }
    if (MONGO_LOAN.status.current !== 'PAID') throw new Error('Only PAID loans can be COMPLETED!');
    const CALCULATED_VALUES = await this.getCalculatedValuesAtTimestamp({
      loanId: MONGO_LOAN._id.toString(),
      timestampLimit: MONGO_LOAN.calculatedLastTransactionTimestamp,
    });

    // Just in case recheck if loan is actualy paid at the time of last transaction
    if (
      _.round(CALCULATED_VALUES.calculatedInvestedAmount, 2) !==
      _.round(
        paranoidCalculator.add(
          CALCULATED_VALUES.calculatedTotalPaidPrincipal,
          CALCULATED_VALUES.calculatedTotalForgiven,
        ),
        2,
      )
    )
      throw new Error('Loan can not be closed if it is not balanced.');

    await this.changeStatus(MONGO_LOAN, 'COMPLETED', Date.now());
    MONGO_LOAN.calculatedInvestedAmount = CALCULATED_VALUES.calculatedInvestedAmount;
    MONGO_LOAN.calculatedLastTransactionTimestamp = CALCULATED_VALUES.calculatedLastTransactionTimestamp;
    MONGO_LOAN.calculatedOutstandingInterest = CALCULATED_VALUES.calculatedOutstandingInterest;
    MONGO_LOAN.calculatedPaidInterest = CALCULATED_VALUES.calculatedPaidInterest;
    MONGO_LOAN.calculatedRelatedBudgets = CALCULATED_VALUES.calculatedRelatedBudgets;
    MONGO_LOAN.calculatedTotalPaidPrincipal = CALCULATED_VALUES.calculatedTotalPaidPrincipal;
    MONGO_LOAN.transactionList = CALCULATED_VALUES.transactionList;

    loanHelpers.runtimeCast({
      ...MONGO_LOAN.toObject(),
      _id: MONGO_LOAN._id.toString(),
      userId: MONGO_LOAN.userId.toString(),
    });
    await MONGO_LOAN.save();
    const recalculatedLoan2 = await this.recalculateCalculatedValues(MONGO_LOAN);
    for (const budget of recalculatedLoan2.calculatedRelatedBudgets) {
      await Budget.updateTransactionList(budget.budgetId);
    }
    return recalculatedLoan2;
  },
  default: async function defaultLoan(
    input: string | ILoanDocument,
    defaultTransactionDescription: string,
  ): Promise<ILoan> {
    const MONGO_LOAN = typeof input === 'string' ? await LoanModel.findOne({ _id: input }) : input;

    // recalculate values just in case
    const RECALCULATED_LOAN = await this.recalculateCalculatedValues(MONGO_LOAN);
    if (
      MONGO_LOAN.status.current === 'PAID' ||
      MONGO_LOAN.status.current === 'COMPLETED' ||
      MONGO_LOAN.status.current === 'DEFAULTED'
    )
      throw new Error('Only active and paused loans can be DEFAULTED!');

    transactionHelpers.validate.description(defaultTransactionDescription);
    defaultTransactionDescription = transactionHelpers.sanitize.description(defaultTransactionDescription);
    try {
      await this.changeStatus(MONGO_LOAN, 'DEFAULTED', Date.now());
      MONGO_LOAN.calculatedInvestedAmount = RECALCULATED_LOAN.calculatedInvestedAmount;
      MONGO_LOAN.calculatedTotalPaidPrincipal = RECALCULATED_LOAN.calculatedTotalPaidPrincipal;
      MONGO_LOAN.calculatedOutstandingInterest = RECALCULATED_LOAN.calculatedOutstandingInterest;
      MONGO_LOAN.calculatedOutstandingFees = RECALCULATED_LOAN.calculatedOutstandingFees;
      MONGO_LOAN.calculatedPaidInterest = RECALCULATED_LOAN.calculatedPaidInterest;
      MONGO_LOAN.calculatedPaidFees = RECALCULATED_LOAN.calculatedPaidFees;
      MONGO_LOAN.calculatedTotalForgiven = RECALCULATED_LOAN.calculatedTotalForgiven;
      MONGO_LOAN.calculatedTotalRefunded = RECALCULATED_LOAN.calculatedTotalRefunded;
      MONGO_LOAN.calculatedRelatedBudgets = RECALCULATED_LOAN.calculatedRelatedBudgets;
      MONGO_LOAN.calculatedLastTransactionTimestamp = RECALCULATED_LOAN.calculatedLastTransactionTimestamp;
      MONGO_LOAN.transactionList = RECALCULATED_LOAN.transactionList;

      loanHelpers.runtimeCast({
        ...MONGO_LOAN.toObject(),
        _id: MONGO_LOAN._id.toString(),
        userId: MONGO_LOAN.userId.toString(),
      });
      await MONGO_LOAN.save();

      const recalculatedLoan = await this.recalculateCalculatedValues(MONGO_LOAN);
      for (const budget of recalculatedLoan.calculatedRelatedBudgets) {
        await Budget.updateTransactionList(budget.budgetId);
      }
      return recalculatedLoan;
    } catch (err) {
      console.log(err);
      throw new Error(err.message);
    }
  },
  /*

  */
  updatePaymentSchedule: async function updateLoanPaymentSchedule({
    userId,
    loanId,
    closesTimestamp,
    paymentFrequency,
    expectedPayments,
  }: {
    userId: string;
    loanId: string;
    closesTimestamp: ILoan['closesTimestamp'];
    paymentFrequency: IPaymentFrequency;
    expectedPayments: ILoan['expectedPayments'];
  }): Promise<ILoan> {
    // Check if user exists
    await User.checkIfExists(userId);

    // Check if loan exists
    await this.checkIfExists(loanId);

    // sanitize and validate inputs
    loanHelpers.validate.closesTimestamp(closesTimestamp);
    paymentFrequencyHelpers.validate.all(paymentFrequency);
    loanHelpers.validate.expectedPayments(expectedPayments);

    // Get loan
    const MONGO_LOAN: ILoanDocument = await LoanModel.findOne({ _id: loanId, userId: userId });

    // set closesTimestamp
    if (MONGO_LOAN.openedTimestamp >= closesTimestamp) throw new Error('Loan can not be closed before it starts!');
    MONGO_LOAN.closesTimestamp = closesTimestamp;

    // set paymentFrequency
    const newPaymentFrequency: IPaymentFrequency = {
      occurrence: paymentFrequency.occurrence,
      isStrict: paymentFrequency.isStrict,
      strictValue: paymentFrequency.strictValue,
      revisions: MONGO_LOAN.paymentFrequency,
      entryTimestamp: paymentFrequency.entryTimestamp,
    };
    paymentFrequencyHelpers.validate.all(paymentFrequency);
    MONGO_LOAN.paymentFrequency = newPaymentFrequency;

    // set expectedPayments
    MONGO_LOAN.expectedPayments = expectedPayments;

    loanHelpers.runtimeCast({
      ...MONGO_LOAN.toObject(),
      _id: MONGO_LOAN._id.toString(),
      userId: MONGO_LOAN.userId.toString(),
    });
    await MONGO_LOAN.save();

    const recalculatedLoan = await this.recalculateCalculatedValues(MONGO_LOAN);
    for (const budget of recalculatedLoan.calculatedRelatedBudgets) {
      await Budget.updateTransactionList(budget.budgetId);
    }
    return recalculatedLoan;
  },
  getCalculatedValuesAtTimestamp: async function getLoanCalculatedValuesAtTimestamp(
    {
      loanId,
      timestampLimit,
    }: {
      loanId: string;
      timestampLimit: number;
    },
    { session = undefined }: { session?: ClientSession } = {},
  ): Promise<
    Pick<
      ILoan,
      | 'calculatedInvestedAmount'
      | 'calculatedTotalPaidPrincipal'
      | 'calculatedOutstandingPrincipal'
      | 'calculatedOutstandingInterest'
      | 'calculatedOutstandingFees'
      | 'calculatedPaidInterest'
      | 'calculatedPaidFees'
      | 'calculatedTotalForgiven'
      | 'calculatedTotalRefunded'
      | 'calculatedLastTransactionTimestamp'
      | 'calculatedRelatedBudgets'
      | 'transactionList'
    >
  > {
    let calculatedInvestedAmount = 0;
    let calculatedTotalPaidPrincipal = 0;
    let calculatedOutstandingPrincipal = 0;
    let calculatedOutstandingInterest = 0;
    let calculatedOutstandingFees = 0;
    let calculatedPaidInterest = 0;
    let calculatedPaidFees = 0;
    let calculatedTotalForgiven = 0;
    let calculatedTotalRefunded = 0;
    let calculatedLastTransactionTimestamp = 0;
    const calculatedRelatedBudgets = {};
    // get all transactions
    const loanTransactions: ITransaction[] = await this.getTransactions(
      loanId,
      {
        pageNumber: 0,
        pageSize: Infinity,
      },
      { session },
    );

    if (loanTransactions.length > 0) calculatedLastTransactionTimestamp = loanTransactions[0].transactionTimestamp;

    loanTransactions.forEach((transaction) => {
      if (transaction.from.datatype === 'BUDGET') {
        if (calculatedRelatedBudgets[transaction.from.addressId] === undefined)
          calculatedRelatedBudgets[transaction.from.addressId] = { invested: 0, withdrawn: 0 };
        calculatedRelatedBudgets[transaction.from.addressId].invested =
          calculatedRelatedBudgets[transaction.from.addressId].invested + transaction.amount;
      }
      if (transaction.from.datatype === 'INTEREST' && transaction.to.datatype === 'LOAN') {
        if (calculatedRelatedBudgets[transaction.relatedBudgetId] === undefined)
          calculatedRelatedBudgets[transaction.relatedBudgetId] = { invested: 0, withdrawn: 0 };
      }
      /* deprecated 
      if (transaction.to.datatype === 'BUDGET') {
        if (calculatedRelatedBudgets[transaction.to.addressId] === undefined)
          calculatedRelatedBudgets[transaction.to.addressId] = { invested: 0, withdrawn: 0 };
        calculatedRelatedBudgets[transaction.to.addressId].withdrawn =
          calculatedRelatedBudgets[transaction.to.addressId].withdrawn + transaction.amount;
      }*/
    });

    const TRANSACTIONS_LIST: ITransactionInterval[] = this.generateTransactionsList({
      loanTransactions: loanTransactions,
      timestampLimit: timestampLimit,
    });
    if (TRANSACTIONS_LIST.length > 0) {
      calculatedInvestedAmount = TRANSACTIONS_LIST[TRANSACTIONS_LIST.length - 1].totalInvested;
      calculatedOutstandingInterest = TRANSACTIONS_LIST[TRANSACTIONS_LIST.length - 1].outstandingInterest;
      calculatedPaidInterest = TRANSACTIONS_LIST[TRANSACTIONS_LIST.length - 1].totalPaidInterest;
      calculatedOutstandingFees = TRANSACTIONS_LIST[TRANSACTIONS_LIST.length - 1].outstandingFees;
      calculatedPaidFees = TRANSACTIONS_LIST[TRANSACTIONS_LIST.length - 1].totalPaidFees;
      calculatedTotalPaidPrincipal = TRANSACTIONS_LIST[TRANSACTIONS_LIST.length - 1].totalPaidPrincipal;
      calculatedOutstandingPrincipal = TRANSACTIONS_LIST[TRANSACTIONS_LIST.length - 1].outstandingPrincipal;
      calculatedTotalForgiven = TRANSACTIONS_LIST[TRANSACTIONS_LIST.length - 1].totalForgiven;
      calculatedTotalRefunded = TRANSACTIONS_LIST[TRANSACTIONS_LIST.length - 1].totalRefunded;
    }
    return {
      calculatedInvestedAmount,
      calculatedOutstandingPrincipal,
      calculatedOutstandingInterest,
      calculatedPaidInterest,
      calculatedOutstandingFees,
      calculatedPaidFees,
      calculatedTotalPaidPrincipal,
      calculatedTotalForgiven,
      calculatedTotalRefunded,
      calculatedLastTransactionTimestamp,
      calculatedRelatedBudgets: Object.keys(calculatedRelatedBudgets).map((key) => {
        return {
          _id: new mongoose.Types.ObjectId().toString(),
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
    session?: ClientSession,
  ): Promise<ILoan> {
    const MONGO_LOAN = typeof input === 'string' ? await LoanModel.findOne({ _id: input }).session(session) : input;

    const CALCULATED_VALUES_UNTIL_NOW = await this.getCalculatedValuesAtTimestamp(
      {
        loanId: MONGO_LOAN._id.toString(),
        timestampLimit: Date.now(),
      },
      { session },
    );
    /* save only when loan is completed or defaulted
    MONGO_LOAN.calculatedInvestedAmount = CALCULATED_VALUES_UNTIL_NOW.calculatedInvestedAmount;
    MONGO_LOAN.calculatedOutstandingPrincipal = CALCULATED_VALUES_UNTIL_NOW.calculatedOutstandingPrincipal;
    MONGO_LOAN.calculatedLastTransactionTimestamp = CALCULATED_VALUES_UNTIL_NOW.calculatedLastTransactionTimestamp;
    MONGO_LOAN.calculatedOutstandingInterest = CALCULATED_VALUES_UNTIL_NOW.calculatedOutstandingInterest;
    MONGO_LOAN.calculatedPaidInterest = CALCULATED_VALUES_UNTIL_NOW.calculatedPaidInterest;
    MONGO_LOAN.calculatedRelatedBudgets = CALCULATED_VALUES_UNTIL_NOW.calculatedRelatedBudgets;
    MONGO_LOAN.calculatedTotalPaidPrincipal = CALCULATED_VALUES_UNTIL_NOW.calculatedTotalPaidPrincipal;
    MONGO_LOAN.calculatedTotalForgiven = CALCULATED_VALUES_UNTIL_NOW.calculatedTotalForgiven;
    MONGO_LOAN.transactionList = CALCULATED_VALUES_UNTIL_NOW.transactionList;
    */
    // Check if PAID
    if (
      _.round(CALCULATED_VALUES_UNTIL_NOW.calculatedOutstandingPrincipal, 2) <= 0 &&
      _.round(CALCULATED_VALUES_UNTIL_NOW.calculatedOutstandingInterest, 2) === 0 &&
      _.round(CALCULATED_VALUES_UNTIL_NOW.calculatedOutstandingFees, 2) === 0 &&
      MONGO_LOAN.status.current === 'ACTIVE'
    ) {
      await this.changeStatus(MONGO_LOAN, 'PAID', Date.now());
    } else if (
      _.round(CALCULATED_VALUES_UNTIL_NOW.calculatedOutstandingPrincipal, 2) > 0 ||
      _.round(CALCULATED_VALUES_UNTIL_NOW.calculatedOutstandingInterest, 2) > 0 ||
      _.round(CALCULATED_VALUES_UNTIL_NOW.calculatedOutstandingFees, 2) > 0
    ) {
      if (MONGO_LOAN.status.current === 'PAID') {
        await this.changeStatus(MONGO_LOAN, 'ACTIVE', Date.now());
      }
    }
    // await MONGO_LOAN.save({ session });

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
    timestampLimit,
  }: {
    loanTransactions: ITransaction[];
    timestampLimit: number | undefined;
  }): ITransactionInterval[] {
    if (timestampLimit === undefined) timestampLimit = new Date().getTime();
    // return empty if no transactions are present in loan
    if (loanTransactions.length === 0) return [];

    if (loanTransactions[0].to.datatype !== 'LOAN' && loanTransactions[0].from.datatype !== 'LOAN')
      throw new Error('Transaction does not include LOAN datatype');

    // check if loanTransactions are in correct order (transactionTimestamp from newest to oldest)
    for (let i = 1; i < loanTransactions.length - 1; i++) {
      if (loanTransactions[i].transactionTimestamp < loanTransactions[i + 1].transactionTimestamp)
        throw new Error('Transactions are not passed in correct order');
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

    // add another empty loan transaction in order to calculate interes
    // Not ideal solution as frontend has to ignore it, but its simple...
    // POSSIBLE SOURCE OF BUGS IS DATA STRUCTURE IS CHANGED
    if (loanTransactions[0].transactionTimestamp <= timestampLimit)
      loanTransactions.unshift({
        _id: '000000000000000000000000',
        userId: loanTransactions[0].userId,
        transactionTimestamp: timestampLimit,
        description: '',
        from: { datatype: 'OUTSIDE', addressId: '' },
        to: { datatype: 'OUTSIDE', addressId: '' },
        amount: 0,
        entryTimestamp: timestampLimit,
      });

    const listOfTransactions: ITransactionInterval[] = [];

    interface IInvestment {
      budgetId: string;
      initialInvestment: number;
      outstandingPrincipal: number;
      totalPaidPrincipal: number;
      outstandingInterest: number;
      totalPaidInterest: number;
      totalRefundedAmount: number;
      totalForgivenAmount: number;
      interestRate: IInterestRate;
      calculatedInterestPerHour: number | undefined;
      fixedAmountInterest: number | undefined;
    }
    const investments: IInvestment[] = [];

    interface IFee {
      budgetId: string;
      outstandingAmount: number;
    }
    const fees: IFee[] = [];

    let totalInvested = 0;
    let totalPaidPrincipal = 0;
    let totalPaidInterest = 0;
    let totalPaidFees = 0;
    let totalRefunded = 0;
    let totalForgiven = 0;
    let outstandingPrincipal = 0;
    let outstandingInterest = 0;
    let outstandingFees = 0;
    for (let i = loanTransactions.length - 1; i >= 0; i--) {
      const loanTransaction = loanTransactions[i];

      const transactionInformation: Pick<
        ITransactionInterval,
        | '_id'
        | 'timestamp'
        | 'description'
        | 'from'
        | 'to'
        | 'invested'
        | 'interestCharged'
        | 'feeCharged'
        | 'principalPaid'
        | 'interestPaid'
        | 'feePaid'
        | 'refundedAmount'
        | 'forgivenAmount'
      > = {
        _id: loanTransaction._id.toString(),
        timestamp: loanTransaction.transactionTimestamp,
        description: loanTransaction.description,
        from: loanTransaction.from,
        to: loanTransaction.to,
        invested: 0,
        interestCharged: 0,
        feeCharged: 0,
        principalPaid: [],
        interestPaid: [],
        feePaid: [],
        refundedAmount: [],
        forgivenAmount: [],
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

      // loop investments and calculate interest for each
      for (const investment of investments) {
        if (investment.outstandingPrincipal <= 0 && investment.outstandingInterest <= 0) continue;
        const interestRate = investment.interestRate;
        if (investment.fixedAmountInterest === undefined) {
          let interestCharged = 0;
          if (interestRate.type === 'PERCENTAGE_PER_DURATION' && interestRate.isCompounding) {
            const interest_percentage_per_hour = investment.calculatedInterestPerHour / 100;
            for (let i = 0; i < DIFFERENCE_IN_HOURS; i++) {
              interestCharged +=
                (investment.outstandingPrincipal + investment.outstandingInterest + interestCharged) *
                interest_percentage_per_hour;
            }
          } else if (interestRate.type === 'PERCENTAGE_PER_DURATION' && !interestRate.isCompounding) {
            const interest_percentage_per_hour = investment.calculatedInterestPerHour / 100;
            interestCharged = investment.outstandingPrincipal * interest_percentage_per_hour * DIFFERENCE_IN_HOURS;
          } else if (interestRate.type === 'FIXED_PER_DURATION' && interestRate.duration !== 'FULL_DURATION') {
            interestCharged = investment.calculatedInterestPerHour * DIFFERENCE_IN_HOURS;
          }
          transactionInformation.interestCharged = interestCharged;
          investment.outstandingInterest += interestCharged;
          outstandingInterest += interestCharged;
        }
      }

      // calculate principal payment and next outstandingPrincipal
      if (loanTransaction.from.datatype === 'BUDGET' && loanTransaction.to.datatype === 'LOAN') {
        // if budget is investing to loan add to investments
        const interestRate = loanTransaction.interestRate;
        const IS_FIXED_AMOUNT_INTEREST =
          interestRate.duration === 'FULL_DURATION' && interestRate.type === 'FIXED_PER_DURATION';

        let interest_per_day = 0;
        let interest_per_hour = 0;

        if (!IS_FIXED_AMOUNT_INTEREST) {
          interest_per_day = normalizeInterestRateToDay(interestRate);
          interest_per_hour = interest_per_day / 24;
        }
        // add fixed amount interest to loan
        /* Deprecated: added in investment stats below
        if (IS_FIXED_AMOUNT_INTEREST) {
          loanTransactions.push({
            _id: '',
            userId: '',
            transactionTimestamp: loanTransaction.transactionTimestamp,
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
            entryTimestamp: loanTransaction.transactionTimestamp + 1, // Add fixed interest after transaction
          });
        }*/
        investments.push({
          budgetId: loanTransaction.from.addressId,
          initialInvestment: loanTransaction.amount,
          outstandingPrincipal: loanTransaction.amount,
          totalPaidPrincipal: 0,
          outstandingInterest: IS_FIXED_AMOUNT_INTEREST ? interestRate.amount : 0,
          totalPaidInterest: 0,
          totalRefundedAmount: 0,
          totalForgivenAmount: 0,
          interestRate: interestRate,
          calculatedInterestPerHour: !IS_FIXED_AMOUNT_INTEREST ? interest_per_hour : undefined,
          fixedAmountInterest: IS_FIXED_AMOUNT_INTEREST ? interestRate.amount : undefined,
        });

        transactionInformation.invested = loanTransaction.amount;
        totalInvested += loanTransaction.amount;
        outstandingPrincipal += loanTransaction.amount;
      } else if (loanTransaction.from.datatype === 'INTEREST') {
        // in case transaction is manual fee
        if (loanTransaction.relatedBudgetId === undefined) {
          throw new Error('Related budget id is undefined');
        }
        fees.push({
          budgetId: loanTransaction.relatedBudgetId.toString(),
          outstandingAmount: loanTransaction.amount,
        });

        transactionInformation.feeCharged = loanTransaction.amount;
        outstandingFees += loanTransaction.amount;
      } else if (loanTransaction.from.datatype === 'OUTSIDE' && loanTransaction.to.datatype === 'LOAN') {
        // in case loan is paid
        let remainingPaymentAmount = loanTransaction.amount;
        // first pay off fees in order of oldest to newest
        for (const fee of fees) {
          if (fee.outstandingAmount <= 0) continue;
          if (remainingPaymentAmount <= 0) break;
          if (remainingPaymentAmount < fee.outstandingAmount) {
            fee.outstandingAmount -= remainingPaymentAmount;
            outstandingFees -= remainingPaymentAmount;
            transactionInformation.feePaid.push({ budgetId: fee.budgetId, amount: remainingPaymentAmount });
            totalPaidFees += remainingPaymentAmount;
            remainingPaymentAmount = 0;
          } else {
            transactionInformation.feePaid.push({ budgetId: fee.budgetId, amount: remainingPaymentAmount });
            totalPaidFees += fee.outstandingAmount;
            outstandingFees -= fee.outstandingAmount;
            remainingPaymentAmount -= fee.outstandingAmount;
            fee.outstandingAmount = 0;
          }
        }
        if (remainingPaymentAmount < 0) throw new Error('Remaining payment amount is negative, and should not be!');

        // then pay off interest of each investment in proportion of their outstanding principal
        let percentageOfTotalInterestPaid = remainingPaymentAmount / outstandingInterest;
        if (percentageOfTotalInterestPaid > 1) percentageOfTotalInterestPaid = 1;

        if (remainingPaymentAmount > 0)
          for (const investment of investments) {
            if (investment.outstandingPrincipal <= 0) continue;

            if (percentageOfTotalInterestPaid === 1) {
              investment.totalPaidInterest += investment.outstandingInterest;
              totalPaidInterest += investment.outstandingInterest;
              outstandingInterest -= investment.outstandingInterest;
              transactionInformation.interestPaid.push({
                budgetId: investment.budgetId,
                amount: investment.outstandingInterest,
              });
              remainingPaymentAmount -= investment.outstandingInterest;
              investment.outstandingInterest = 0;
            } else {
              const interestPaidToInvestment = investment.outstandingInterest * percentageOfTotalInterestPaid;
              investment.outstandingInterest -= interestPaidToInvestment;
              investment.totalPaidInterest += interestPaidToInvestment;
              totalPaidInterest += interestPaidToInvestment;
              outstandingInterest -= interestPaidToInvestment;
              transactionInformation.interestPaid.push({
                budgetId: investment.budgetId,
                amount: interestPaidToInvestment,
              });
              remainingPaymentAmount -= interestPaidToInvestment;
            }
          }

        if (remainingPaymentAmount < 0) throw new Error('Remaining payment amount is negative, and should not be!');

        // then pay off principal of each investment in proportion of their outstanding principal

        if (remainingPaymentAmount > 0)
          for (const investment of investments) {
            if (investment.outstandingPrincipal <= 0) continue;

            const principalPaidToInvestment =
              remainingPaymentAmount * (investment.outstandingPrincipal / outstandingPrincipal);
            investment.outstandingPrincipal -= principalPaidToInvestment;
            investment.totalPaidPrincipal += principalPaidToInvestment;
            outstandingPrincipal -= principalPaidToInvestment;
            totalPaidPrincipal += principalPaidToInvestment;
            transactionInformation.principalPaid.push({
              budgetId: investment.budgetId,
              amount: principalPaidToInvestment,
            });
          }
      } else if (loanTransaction.from.datatype === 'LOAN' && loanTransaction.to.datatype === 'OUTSIDE') {
        // Refund
        for (const investment of investments) {
          const refundAmountForInvestment =
            loanTransaction.amount * (investment.outstandingPrincipal / outstandingPrincipal);
          investment.outstandingPrincipal += refundAmountForInvestment;
          investment.totalRefundedAmount += refundAmountForInvestment;
          outstandingPrincipal += refundAmountForInvestment;
          totalRefunded += refundAmountForInvestment;
          transactionInformation.refundedAmount.push({
            budgetId: investment.budgetId,
            amount: refundAmountForInvestment,
          });
        }
      } else if (loanTransaction.from.datatype === 'LOAN' && loanTransaction.to.datatype === 'FORGIVENESS') {
        //  Forgiveness
        // First forgive interest
        let remainingForgivenessAmount = loanTransaction.amount;

        let percentageOfTotalInterestOutstanding = remainingForgivenessAmount / outstandingInterest;
        if (percentageOfTotalInterestOutstanding > 1) percentageOfTotalInterestOutstanding = 1;

        for (const investment of investments) {
          if (investment.outstandingPrincipal <= 0) continue;

          if (percentageOfTotalInterestOutstanding === 1) {
            investment.totalForgivenAmount += investment.outstandingInterest;
            totalForgiven += investment.outstandingInterest;
            transactionInformation.forgivenAmount.push({
              budgetId: investment.budgetId,
              amount: investment.outstandingInterest,
            });
            remainingForgivenessAmount -= investment.outstandingInterest;
            investment.outstandingInterest = 0;
          } else {
            const interestForgivenToInvestment = investment.outstandingInterest * percentageOfTotalInterestOutstanding;
            investment.outstandingInterest -= interestForgivenToInvestment;
            investment.totalForgivenAmount += interestForgivenToInvestment;
            totalForgiven += interestForgivenToInvestment;
            transactionInformation.forgivenAmount.push({
              budgetId: investment.budgetId,
              amount: interestForgivenToInvestment,
            });
            remainingForgivenessAmount -= interestForgivenToInvestment;
          }
        }

        if (remainingForgivenessAmount < 0)
          throw new Error('Remaining forgiveness amount is negative, and should not be!');

        // then forgive principal of each investment in proportion of their outstanding principal

        if (remainingForgivenessAmount > 0)
          for (const investment of investments) {
            if (investment.outstandingPrincipal <= 0) continue;

            const principalForgivenToInvestment =
              remainingForgivenessAmount * (investment.outstandingPrincipal / outstandingPrincipal);
            investment.outstandingPrincipal -= principalForgivenToInvestment;
            investment.totalForgivenAmount += principalForgivenToInvestment;
            outstandingPrincipal -= principalForgivenToInvestment;
            totalForgiven += principalForgivenToInvestment;
            transactionInformation.forgivenAmount.push({
              budgetId: investment.budgetId,
              amount: principalForgivenToInvestment,
            });
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
        totalPaidFees: totalPaidFees,
        totalRefunded: totalRefunded,
        totalForgiven: totalForgiven,
        outstandingPrincipal: outstandingPrincipal,
        outstandingInterest: outstandingInterest,
        outstandingFees: outstandingFees,
      });
    }
    return listOfTransactions;
  },
  notifyUsers: async function notifyUsers(): Promise<void> {
    // 1. get all loans with status 'ACTIVE' and expectedPayments that are older than now and have not been notified and get loan.userId notificationTokens
    type PopulatedLoan = ILoan & { userId: IUser };
    const loans = await LoanModel.find<PopulatedLoan>({
      'status.current': 'ACTIVE',
      expectedPayments: {
        $elemMatch: {
          timestamp: {
            $lte: Date.now(),
          },
          notified: false,
        },
      },
    }).populate('userId', 'notificationTokens');
    //  2. send notification using sendNotifications function
    /* send notifications accepts argument array of Message that has following structure:
    {
      data: {
        loanId: loan._id.toString(),
      };
      notification: {
          title: `Loan is expecting payment`, // TODO: Multilingual support
          body: `Your loan &{loan.name} is expecting payment of &{loan.expectedPayments[0].amount}`,
      };
      token: notificationToken,
    }

    each users notificationToken represents one device, so if user has multiple devices, then multiple messages should be
    pushed to array of messages (one for each notification token).

    */
    const messages: TokenMessage[] = [];
    loans.forEach((loan) => {
      loan.userId.notificationTokens.forEach((notificationToken) => {
        // Get the amount from first expected payment that is not notified
        const expectedPayment = loan.expectedPayments.find((expectedPayment) => !expectedPayment.notified);
        let amount = undefined;
        expectedPayment !== undefined
          ? (amount = expectedPayment.principalPayment + expectedPayment.interestPayment)
          : (amount = 0);

        messages.push({
          data: {
            notificationType: 'paymentReminder',
            loanId: loan._id.toString(),
            loanName: loan.name,
            amount: amount.toString(),
            userId: loan.userId._id.toString(),
          },
          notification: {
            title: `Loan is expecting payment`, // TODO: Multilingual support
            body: `Your loan ${loan.name} is expecting payment!`,
          },
          token: notificationToken,
        });
      });
    });
    if (messages.length === 0) return;
    const feedback = await sendNotifications(messages, false);
    // 3. update loans with notified: true
    await LoanModel.updateMany(
      {
        'status.current': 'ACTIVE',
        expectedPayments: {
          $elemMatch: {
            timestamp: {
              $lte: Date.now(),
            },
            notified: false,
          },
        },
      },
      {
        $set: {
          'expectedPayments.$.notified': true,
        },
      },
    );
    // 4. remove notificationTokens that are not valid anymore
    feedback.responses.forEach(async (response, index) => {
      if (response.error && response.error.code === 'messaging/registration-token-not-registered') {
        // remove notificationToken from user document ( userId: messages[index].data.userId, token: messages[index].token )
        await UserModel.updateOne(
          {
            _id: messages[index].data.userId,
          },
          {
            $pull: {
              notificationTokens: messages[index].token,
            },
          },
        );
      }
    });
  },
  /*
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
      } 

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
  },*/
  // As a lender, I want to export loan data and transactions, so that I can archive them or import them to other software.
  export: function joinLoanTransactionsIntoAccountingTable(): void {
    // TODO
  },
};

Loan.notifyUsers();
// notify users about payments that are due every hour
setInterval(() => {
  Loan.notifyUsers();
}, 1000 * 60 * 60);

export default Loan;

/*
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
*/
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
