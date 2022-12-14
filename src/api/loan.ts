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
import { ILoan } from './types/loan/loanInterface.js';
import { ITransaction } from './types/transaction/transactionInterface.js';
import Budget from './budget.js';
import { transactionHelpers } from './types/transaction/transactionHelpers.js';
import {
  ITransactionInterval,
  IInterestRate,
  IAmortizationInterval,
} from './types/interestRate/interestRateInterface.js';
import LoanModel, { ILoanDocument } from './db/model/LoanModel.js';
import LoanCache from './cache/loanCache.js';

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
          calculatedChargedInterest: 0,
          calculatedPaidInterest: 0,
          calculatedTotalPaidPrincipal: 0,
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
      LoanCache.setCachedItem({ itemId: recalculatedLoan._id, value: recalculatedLoan });

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
    console.log(userId);
    if (LoanCache.getCachedItem({ itemId: loanId })) {
      return LoanCache.getCachedItem({ itemId: loanId }) as ILoan;
    } else {
      const MONGO_LOAN = await LoanModel.findOne({ _id: loanId, userId: userId }).session(session);
      const recalculatedLoan = await this.recalculateCalculatedValues(MONGO_LOAN);
      LoanCache.setCachedItem({ itemId: loanId, value: recalculatedLoan });
      return recalculatedLoan;
    }
  },
  getAllFromUser: async function getLoans(
    { userId }: { userId: string },
    { session = undefined }: { session?: ClientSession } = {},
  ): Promise<ILoan[]> {
    const LOANS = await LoanModel.find({ userId: userId }).session(session).exec();
    const returnValue: ILoan[] = [];
    for (let i = 0; i < LOANS.length; i++) {
      const LOAN_ID = LOANS[i]._id.toString();
      if (LoanCache.getCachedItem({ itemId: LOAN_ID })) {
        returnValue.push(LoanCache.getCachedItem({ itemId: LOAN_ID }) as ILoan);
      } else {
        const recalculatedLoan = await this.recalculateCalculatedValues(LOANS[i]);
        LoanCache.setCachedItem({ itemId: LOAN_ID, value: recalculatedLoan });
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
      LoanCache.setCachedItem({
        itemId: loanId,
        value: await this.recalculateCalculatedValues(loanId),
      });
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
      LoanCache.setCachedItem({
        itemId: loanId,
        value: await this.recalculateCalculatedValues(loanId),
      });
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
      LoanCache.setCachedItem({
        itemId: loanId,
        value: await this.recalculateCalculatedValues(loanId),
      });
    }
    return NEW_TRANSACTION;
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
    User.checkIfExists(userId);

    // Check if loan exists
    this.checkIfExists(loanId);

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
      | 'calculatedChargedInterest'
      | 'calculatedPaidInterest'
    >
  > {
    let calculatedInvestedAmount = 0;
    let calculatedTotalPaidPrincipal = 0;
    let calculatedChargedInterest = 0;
    let calculatedPaidInterest = 0;

    // get all transactions
    const loanTransactions: ITransaction[] = await this.getTransactions(loanId, {
      pageNumber: 0,
      pageSize: Infinity,
    });
    const TRANSACTIONS_LIST: ITransactionInterval[] = this.generateTransactionsList({
      loanTransactions: loanTransactions,
      interestRate: interestRate,
      timestampLimit: timestampLimit,
    });
    if (TRANSACTIONS_LIST.length > 0) {
      for (let i = 0; i < TRANSACTIONS_LIST.length; i++) {
        const TRANSACTION = TRANSACTIONS_LIST[i];
        // TODO PARANAID CALCULATOR
        if (TRANSACTION.principalCharge < 0) calculatedInvestedAmount -= TRANSACTION.principalCharge;
        else if (TRANSACTION.principalCharge > 0) calculatedTotalPaidPrincipal += TRANSACTION.principalCharge;
        if (TRANSACTION.interestCharge > 0) calculatedChargedInterest += TRANSACTION.interestCharge;
        else if (TRANSACTION.interestCharge < 0) calculatedPaidInterest -= TRANSACTION.interestCharge;
      }
    }
    return {
      calculatedInvestedAmount,
      calculatedChargedInterest,
      calculatedPaidInterest,
      calculatedTotalPaidPrincipal,
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
    MONGO_LOAN.calculatedInvestedAmount = CALCULATED_VALUES_UNTIL_NOW.calculatedInvestedAmount;
    MONGO_LOAN.calculatedTotalPaidPrincipal = CALCULATED_VALUES_UNTIL_NOW.calculatedTotalPaidPrincipal;
    MONGO_LOAN.calculatedChargedInterest = CALCULATED_VALUES_UNTIL_NOW.calculatedChargedInterest;
    MONGO_LOAN.calculatedPaidInterest = CALCULATED_VALUES_UNTIL_NOW.calculatedPaidInterest;

    //if(CALCULATED_VALUES_UNTIL_NOW.calculatedTotalAvailableAmount >= CALCULATED_VALUES_UNTIL_NOW.calculatedInvestedAmount){
    //
    //}
    const CHANGED_LOAN = loanHelpers.runtimeCast({
      ...MONGO_LOAN.toObject(),
      _id: MONGO_LOAN._id.toString(),
      userId: MONGO_LOAN.userId.toString(),
    });
    await MONGO_LOAN.save();
    return CHANGED_LOAN;
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
          addressId: '000000000000000000000000',
        },
        to: {
          datatype: 'LOAN',
          addressId: loanId,
        },
        amount: interestRate.amount,
        entryTimestamp: loanTransactions[loanTransactions.length - 1].transactionTimestamp,
      });
    }

    // add another empty loan transaction for now in order to calculate interest until now
    // POSSIBLE SOURCE OF BUGS IS DATA STRUCTURE IS CHANGED
    if (loanTransactions[0].transactionTimestamp < timestampLimit)
      loanTransactions.unshift({
        _id: '',
        userId: '',
        transactionTimestamp: timestampLimit,
        description: '',
        from: { datatype: 'INTEREST', addressId: '' },
        to: { datatype: 'INTEREST', addressId: '' },
        amount: 0,
        entryTimestamp: timestampLimit,
      });

    const listOfTransactions: ITransactionInterval[] = [];
    let outstandingPrincipal = 0;
    let outstandingInterest = 0;
    for (let i = loanTransactions.length - 1; i >= 0; i--) {
      const loanTransaction = loanTransactions[i];

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
      let interestCharge = 0;

      if (!IS_FIXED_AMOUNT_INTEREST) {
        if (interestRate.type === 'PERCENTAGE_PER_DURATION' && interestRate.isCompounding) {
          for (let i = 0; i < DIFFERENCE_IN_HOURS; i++) {
            interestCharge += (outstandingPrincipal + interestCharge) * interest_percentage_per_hour;
          }
        } else if (interestRate.type === 'PERCENTAGE_PER_DURATION' && !interestRate.isCompounding) {
          interestCharge = outstandingPrincipal * interest_percentage_per_hour * DIFFERENCE_IN_HOURS;
        } else if (interestRate.type === 'FIXED_PER_DURATION' && interestRate.duration !== 'FULL_DURATION') {
          interestCharge = interest_per_hour * DIFFERENCE_IN_HOURS;
        }
      }
      // calculate principal payment and next outstandingPrincipal
      let principalCharge: number;
      if (loanTransaction.from.datatype === 'BUDGET') {
        principalCharge = -loanTransaction.amount;
        outstandingPrincipal = outstandingPrincipal - principalCharge;
      } else if (loanTransaction.from.datatype === 'INTEREST') {
        principalCharge = 0;
        interestCharge += loanTransaction.amount;
        outstandingInterest = outstandingInterest + interestCharge;
      } else if (loanTransaction.from.datatype === 'LOAN') {
        outstandingInterest = outstandingInterest + interestCharge;
        if (loanTransaction.amount <= outstandingInterest) {
          interestCharge = -loanTransaction.amount;
          outstandingInterest = outstandingInterest + loanTransaction.amount;
          principalCharge = 0;
        } else {
          interestCharge = -outstandingInterest;
          outstandingInterest = outstandingInterest + interestCharge;
          principalCharge = loanTransaction.amount + interestCharge;
          outstandingPrincipal = outstandingPrincipal - principalCharge;
        }
      }

      listOfTransactions.push({
        fromDateTimestamp: fromDateTimestamp,
        toDateTimestamp: toDateTimestamp,
        interestCharge: interestCharge,
        principalCharge: principalCharge,
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
