import mongoose from 'mongoose';
import {
  //add,
  differenceInHours,
  differenceInCalendarDays,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachYearOfInterval,
} from 'date-fns';
import UserModel from './db/model/UserModel.js';
import transaction from './transaction.js';
import { loanHelpers } from './types/loan/loanHelpers.js';
import { ILoan } from './types/loan/loanInterface.js';
import { ITransaction } from './types/transaction/transactionInterface.js';
import Budget from './budget.js';
import paranoidCalculator from './utils/paranoidCalculator/paranoidCalculator.js';
import { transactionHelpers } from './types/transaction/transactionHelpers.js';
import {
  IAmortizationInterval,
  ITransactionInterval,
  IInterestRate,
} from './types/interestRate/interestRateInterface.js';
import LoanModel from './db/model/LoanModel.js';
import BudgetModel from './db/model/BudgetModel.js';
import LoanCache from './cache/loanCache.js';

interface fund {
  budgetId: string;
  amount: number;
}

export default {
  // As a lender, I want to create new loans, so that I can later track specific loan transactions and info.
  create: async function createLoan(
    userId: string,
    input: Pick<
      ILoan,
      'name' | 'description' | 'openedTimestamp' | 'closesTimestamp' | 'initialPrincipal' | 'interestRate'
    >,
    funds: fund[],
    initialTransactionDescription: string,
  ): Promise<ILoan> {
    // Do checks on inputs
    loanHelpers.validate.all(input);
    loanHelpers.sanitize.all(input);

    if (funds.length <= 0) throw new Error('Funds should be provided to new loan!');

    // Get user
    const user: any = await UserModel.findOne({ _id: userId });
    if (user === null) throw new Error('User with provided userId was not found!');

    // check if budgets have sufficient funds

    for (let i = 0; i < funds.length; i++) {
      const recalculatedBudget = await Budget.recalculateCalculatedValues({ budgetId: funds[i].budgetId });

      const avaiableFundsInBudget = paranoidCalculator.subtract(
        recalculatedBudget.calculatedTotalAmount,
        recalculatedBudget.calculatedLendedAmount,
      );
      if (avaiableFundsInBudget < funds[i].amount)
        throw new Error(`Budget (id: ${funds[i].budgetId}) has insufficient funds.`);
    }

    const loan: ILoan = loanHelpers.runtimeCast({
      _id: new mongoose.Types.ObjectId().toString(),
      userId: userId,
      ...input,
      notes: [],
      status: 'ACTIVE',
      calculatedChargedInterest: 0,
      calculatedPaidInterest: 0,
      calculatedTotalPaidPrincipal: 0,
    });

    const session = await global.mongooseConnection.startSession();
    try {
      session.startTransaction();
      const newLoan = await new LoanModel(loan).save({ session });

      // Prepare initial transactions from budgets to loan in creation
      for (let i = 0; i < funds.length; i++) {
        await transaction.transferAmountFromBudgetToLoan(
          {
            userId: userId,
            budgetId: funds[i].budgetId,
            loanId: loan._id,
            transactionTimestamp: transactionHelpers.validate.transactionTimestamp(new Date().getTime()),
            description: initialTransactionDescription,
            amount: funds[i].amount,
            entryTimestamp: transactionHelpers.validate.entryTimestamp(new Date().getTime()),
          },
          { session },
        );
      }
      await session.commitTransaction();

      // recalculate affected budgets
      await funds.forEach(async (fund) => {
        await Budget.recalculateCalculatedValues({ budgetId: fund.budgetId });
      });
      console.log(newLoan);
    } catch (err) {
      console.log(err);
      await session.abortTransaction();
    } finally {
      session.endSession();
    }
    return loan;
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
    // Get user
    const user = await UserModel.findOne({ _id: userId });
    if (user === null) throw new Error('User does not exist!');
    // Get loan
    const loan: any = await LoanModel.findOne({ _id: loanId });
    if (loan === null) throw new Error('loan does not exist!');

    const newInfo: any = {};
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
      _id: loan._id.toString(),
      userId: loan.userId.toString(),
      name: loan.name,
      description: loan.description,
      notes: loan.notes,
      openedTimestamp: loan.openedTimestamp,
      closesTimestamp: loan.closesTimestamp,
      interestRate: {
        type: loan.interestRate.type,
        duration: loan.interestRate.duration,
        expectedPayments: loan.interestRate.expectedPayments,
        amount: loan.interestRate.amount,
        isCompounding: loan.interestRate.isCompounding,
        entryTimestamp: loan.interestRate.entryTimestamp,
        revisions: loan.interestRate.revisions,
      },
      initialPrincipal: loan.inititalPrincipal,
      calculatedTotalPaidPrincipal: loan.calculatedTotalPaidPrincipal,
      calculatedChargedInterest: loan.calculatedChargedInterest,
      calculatedPaidInterest: loan.calculatedPaidInterest,
    } as ILoan);
    await loan.save();
    return changedloan;
  },
  getOneFromUser: async function getLoan({ userId, loanId }: { userId: string; loanId: string }): Promise<ILoan> {
    const Mongo_loan: any = await LoanModel.findOne({ _id: loanId, userId: userId }).exec();
    if (LoanCache.getCachedItem({ itemId: loanId })) {
      return LoanCache.getCachedItem({ itemId: loanId }) as ILoan;
    } else {
      const recalculatedLoan = await this.recalculateCalculatedValues({ loan: Mongo_loan });
      LoanCache.setCachedItem({ itemId: loanId, value: recalculatedLoan });
      return recalculatedLoan;
    }
  },

  getAllFromUser: async function getLoans({ userId }: { userId: string }): Promise<ILoan[]> {
    const Mongo_loans: any = await LoanModel.find({ userId: userId }).lean().exec();
    const returnValue: ILoan[] = [];
    for (let i = 0; i < Mongo_loans.length; i++) {
      const LOAN_ID = Mongo_loans[i]._id.toString();
      if (LoanCache.getCachedItem({ itemId: LOAN_ID })) {
        returnValue.push(LoanCache.getCachedItem({ itemId: LOAN_ID }) as ILoan);
      } else {
        const recalculatedLoan = await this.recalculateCalculatedValues({ loan: Mongo_loans[i] });
        LoanCache.setCachedItem({ itemId: LOAN_ID, value: recalculatedLoan });
        returnValue.push(recalculatedLoan);
      }
    }
    return returnValue;
    /* return await Mongo_loans.map(async (Mongo_loan) => {
      return await this.recalculateCalculatedValues({ loanId: Mongo_loan._id.toString() });
      return loanHelpers.runtimeCast({
        _id: Mongo_loan._id.toString(),
        userId: Mongo_loan.userId.toString(),
        name: Mongo_loan.name,
        description: Mongo_loan.description,
        notes: Mongo_loan.notes,
        openedTimestamp: Mongo_loan.openedTimestamp,
        closesTimestamp: Mongo_loan.closesTimestamp,
        interestRate: {
          type: Mongo_loan.interestRate.type,
          duration: Mongo_loan.interestRate.duration,
          expectedPayments: Mongo_loan.interestRate.expectedPayments,
          amount: Mongo_loan.interestRate.amount,
          isCompounding: Mongo_loan.interestRate.isCompounding,
          entryTimestamp: Mongo_loan.interestRate.entryTimestamp,
          revisions: Mongo_loan.interestRate.revisions,
        },
        initialPrincipal: Mongo_loan.initialPrincipal,
        status: Mongo_loan.status,
        calculatedTotalPaidPrincipal: Mongo_loan.calculatedTotalPaidPrincipal,
        calculatedChargedInterest: Mongo_loan.calculatedChargedInterest,
        calculatedPaidInterest: Mongo_loan.calculatedPaidInterest,
      });
    });*/
  },

  changeInterestRate: async function changeLoanInterestRate() {
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
  addPayment: async function addLoanPayment({
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
  }): Promise<ITransaction> {
    // Get user
    const user = await UserModel.findOne({ _id: userId });
    if (user === null) throw new Error('User does not exist!');
    // Get loan
    const Mongo_loan: any = await LoanModel.findOne({ _id: loanId });
    if (Mongo_loan === null) throw new Error('loan does not exist!');

    const budget: any = await BudgetModel.findOne({ _id: budgetId });
    if (budget === null) throw new Error('budget does not exist!');

    transactionHelpers.validate.description(description);
    description = transactionHelpers.sanitize.description(description);
    transactionHelpers.validate.amount(amount);
    const newTransaction = await transaction.transferAmountFromLoanToBudget({
      userId: userId,
      loanId: loanId,
      budgetId: budgetId,
      transactionTimestamp: transactionHelpers.validate.transactionTimestamp(transactionTimestamp),
      description: description,
      amount: amount,
      entryTimestamp: transactionHelpers.validate.entryTimestamp(new Date().getTime()),
    });

    await Budget.recalculateCalculatedValues({ budgetId: budgetId });
    LoanCache.setCachedItem({ itemId: loanId, value: await this.recalculateCalculatedValues({ loan: Mongo_loan }) });

    return newTransaction;
  },

  addFunds: async function addFundsToLoan(
    userId: string,
    budgetId: string,
    loanId: string,
    transactionTimestamp: number,
    description: string,
    amount: number,
  ): Promise<ITransaction> {
    // Get user
    const user = await UserModel.findOne({ _id: userId });
    if (user === null) throw new Error('User does not exist!');
    // Get loan
    const Mongo_loan: any = await LoanModel.findOne({ _id: loanId });
    if (Mongo_loan === null) throw new Error('loan does not exist!');

    const budget: any = await BudgetModel.findOne({ _id: budgetId });
    if (budget === null) throw new Error('budget does not exist!');

    transactionHelpers.validate.description(description);
    description = transactionHelpers.sanitize.description(description);
    transactionHelpers.validate.amount(amount);
    const NEW_TRANSACTION = await transaction.transferAmountFromBudgetToLoan({
      userId: userId,
      loanId: loanId,
      budgetId: budgetId,
      transactionTimestamp: transactionHelpers.validate.transactionTimestamp(transactionTimestamp),
      description: description,
      amount: amount,
      entryTimestamp: transactionHelpers.validate.entryTimestamp(new Date().getTime()),
    });
    await Budget.recalculateCalculatedValues({ budgetId: budgetId });
    LoanCache.setCachedItem({ itemId: loanId, value: await this.recalculateCalculatedValues({ loan: Mongo_loan }) });
    return NEW_TRANSACTION;
  },

  addManualInterest: async function addManualInterestToLoan({
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
  }): Promise<ITransaction> {
    // Get user
    const user = await UserModel.findOne({ _id: userId });
    if (user === null) throw new Error('User does not exist!');
    // Get loan
    const loan: any = await LoanModel.findOne({ _id: loanId });
    if (loan === null) throw new Error('loan does not exist!');

    transactionHelpers.validate.transactionTimestamp(transactionTimestamp);
    transactionHelpers.validate.description(description);
    description = transactionHelpers.sanitize.description(description);
    transactionHelpers.validate.amount(amount);

    const newTransactionInfo: Pick<
      ITransaction,
      'userId' | 'transactionTimestamp' | 'description' | 'from' | 'to' | 'amount' | 'entryTimestamp'
    > = {
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
    };
    const NEW_TRANSACTION = await transaction.add(newTransactionInfo);

    LoanCache.setCachedItem({ itemId: loanId, value: await this.recalculateCalculatedValues({ loan: loan }) });
    return NEW_TRANSACTION;
  },

  // As a lender, I want to change the status of the loan, so that status reflects the real world.
  changeStatus: async function changeLoanStatus(
    userId: string,
    loanId: string,
    newStatus: Pick<ILoan, 'status'>,
  ): Promise<ILoan> {
    // Get user
    const user = await UserModel.findOne({ _id: userId });
    if (user === null) throw new Error('User does not exist!');
    // Get loan
    const loan: any = await LoanModel.findOne({ _id: loanId });
    if (loan === null) throw new Error('loan does not exist!');
    loanHelpers.validate.status(newStatus);
    loan.status = newStatus;
    const changedloan: ILoan = loanHelpers.runtimeCast({
      _id: loan._id.toString(),
      userId: loan.userId.toString(),
      name: loan.name,
      description: loan.description,
      notes: loan.notes,
      openedTimestamp: loan.openedTimestamp,
      closesTimestamp: loan.closesTimestamp,
      interestRate: {
        type: loan.interestRate.type,
        duration: loan.interestRate.duration,
        expectedPayments: loan.interestRate.expectedPayments,
        amount: loan.interestRate.amount,
        isCompounding: loan.interestRate.isCompounding,
        entryTimestamp: loan.interestRate.entryTimestamp,
        revisions: loan.interestRate.revisions,
      },
      initialPrincipal: loan.initialPrincipal,
      status: loan.status,
      calculatedTotalPaidPrincipal: loan.calculatedTotalPaidPrincipal,
      calculatedChargedInterest: loan.calculatedChargedInterest,
      calculatedPaidInterest: loan.calculatedPaidInterest,
    } as ILoan);
    await loan.save();
    return changedloan;
  },
  recalculateCalculatedValues: async function recalculateLoanCalculatedValues({
    Mongo_loan,
  }: {
    Mongo_loan: any;
  }): Promise<ILoan> {
    let calculatedTotalPaidPrincipal = 0;
    let calculatedChargedInterest = 0;
    let calculatedPaidInterest = 0;
    const TRANSACTIONS_LIST = await this.generateTransactionsList({
      loanId: Mongo_loan._id,
      interestRate: Mongo_loan.interestRate,
    });
    if (TRANSACTIONS_LIST.length > 0) {
      for (let i = 0; i < TRANSACTIONS_LIST.length; i++) {
        const TRANSACTION = TRANSACTIONS_LIST[i];
        if (TRANSACTION.principalCharge > 0) calculatedTotalPaidPrincipal += TRANSACTION.principalCharge;
        calculatedPaidInterest += TRANSACTION.interestCharge;
      }
      calculatedChargedInterest += TRANSACTIONS_LIST[TRANSACTIONS_LIST.length - 1].outstandingInterest;
    }
    Mongo_loan.calculatedTotalPaidPrincipal = calculatedTotalPaidPrincipal;
    Mongo_loan.calculatedChargedInterest = calculatedChargedInterest;
    Mongo_loan.calculatedPaidInterest = calculatedPaidInterest;
    const CHANGED_LOAN = loanHelpers.runtimeCast({
      _id: Mongo_loan._id.toString(),
      userId: Mongo_loan.userId.toString(),
      name: Mongo_loan.name,
      description: Mongo_loan.description,
      notes: Mongo_loan.notes,
      openedTimestamp: Mongo_loan.openedTimestamp,
      closesTimestamp: Mongo_loan.closesTimestamp,
      interestRate: {
        type: Mongo_loan.interestRate.type,
        duration: Mongo_loan.interestRate.duration,
        expectedPayments: Mongo_loan.interestRate.expectedPayments,
        amount: Mongo_loan.interestRate.amount,
        isCompounding: Mongo_loan.interestRate.isCompounding,
        entryTimestamp: Mongo_loan.interestRate.entryTimestamp,
        revisions: Mongo_loan.interestRate.revisions,
      },
      initialPrincipal: Mongo_loan.initialPrincipal,
      status: Mongo_loan.status,
      calculatedTotalPaidPrincipal: Mongo_loan.calculatedTotalPaidPrincipal,
      calculatedChargedInterest: Mongo_loan.calculatedChargedInterest,
      calculatedPaidInterest: Mongo_loan.calculatedPaidInterest,
    } as ILoan);
    await Mongo_loan.save();
    return CHANGED_LOAN;
  },
  generateTransactionsList: async function generateLoanTransactionsList({
    loanId,
    interestRate,
  }: {
    loanId: string;
    interestRate: IInterestRate;
  }): Promise<ITransactionInterval[]> {
    const INTEREST_PER_DAY = normalizeInterestRateToDay(interestRate);
    const INTEREST_PER_HOUR = INTEREST_PER_DAY / 24;
    const INTEREST_PERCENTAGE_PER_HOUR = INTEREST_PER_HOUR / 100;
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
    // get all transactions
    const loanTransactions: ITransaction[] = await this.getTransactions(loanId, {
      pageNumber: 0,
      pageSize: Infinity,
    });
    if (loanTransactions.length === 0) return [];
    // add another empty loan transaction for now in order to calculate interest until now
    // POSSIBLE SOURCE OF BUGS IS DATA STRUCTURE IS CHANGED
    const NOW = new Date().getTime();
    if (loanTransactions[0].transactionTimestamp < NOW)
      loanTransactions.unshift({
        _id: '',
        userId: '',
        transactionTimestamp: NOW,
        description: '',
        from: { datatype: 'INTEREST', addressId: '' },
        to: { datatype: 'INTEREST', addressId: '' },
        amount: 0,
        entryTimestamp: NOW,
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

      if (interestRate.type === 'PERCENTAGE_PER_DURATION' && interestRate.isCompounding) {
        // for daily calculation // const interestPercentagePerDay = interestPerDay / 100;
        for (let i = 0; i < DIFFERENCE_IN_HOURS; i++) {
          interestCharge += (outstandingPrincipal + interestCharge) * INTEREST_PERCENTAGE_PER_HOUR;
        }
      } else if (interestRate.type === 'PERCENTAGE_PER_DURATION' && !interestRate.isCompounding) {
        // for daily calculation // const interestPercentagePerDay = interestPerDay / 100;
        interestCharge = outstandingPrincipal * INTEREST_PERCENTAGE_PER_HOUR * DIFFERENCE_IN_HOURS;
      } else if (interestRate.type === 'FIXED_PER_DURATION' && interestRate.duration !== 'FULL_DURATION') {
        interestCharge = INTEREST_PER_HOUR * DIFFERENCE_IN_HOURS;
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
          interestCharge = loanTransaction.amount;
          outstandingInterest = outstandingInterest - interestCharge;
          principalCharge = 0;
        } else {
          interestCharge = outstandingInterest;
          outstandingInterest = outstandingInterest - interestCharge;
          principalCharge = loanTransaction.amount - interestCharge;
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
    const listOfPayments: IAmortizationInterval[] = [];
    const loanDurationInDays = differenceInCalendarDays(new Date(closesTimestamp), new Date(openedTimestamp));
    const principalPaymentPerDay = amount / loanDurationInDays;
    const interestPerDay = normalizeInterestRateToDay(interestRate);

    let paymentDaysTimestamps: number[] = [];

    if (interestRate.expectedPayments === 'DAILY') {
      paymentDaysTimestamps = eachDayOfInterval({
        start: openedTimestamp,
        end: closesTimestamp,
      }).map((date) => date.getTime());
      paymentDaysTimestamps.shift();
    } else if (interestRate.expectedPayments === 'WEEKLY') {
      paymentDaysTimestamps = eachWeekOfInterval({
        start: openedTimestamp,
        end: closesTimestamp,
      }).map((date) => date.getTime());
      paymentDaysTimestamps.shift();
      if (paymentDaysTimestamps[paymentDaysTimestamps.length - 1] !== closesTimestamp) {
        paymentDaysTimestamps.push(closesTimestamp);
      }
    } else if (interestRate.expectedPayments === 'MONTHLY') {
      paymentDaysTimestamps = eachMonthOfInterval({
        start: openedTimestamp,
        end: closesTimestamp,
      }).map((date) => date.getTime());
      paymentDaysTimestamps.shift();
      if (paymentDaysTimestamps[paymentDaysTimestamps.length - 1] !== closesTimestamp) {
        paymentDaysTimestamps.push(closesTimestamp);
      }
    } else if (interestRate.expectedPayments === 'YEARLY') {
      paymentDaysTimestamps = eachYearOfInterval({
        start: openedTimestamp,
        end: closesTimestamp,
      }).map((date) => date.getTime());
      paymentDaysTimestamps.shift();
      if (paymentDaysTimestamps[paymentDaysTimestamps.length - 1] !== closesTimestamp) {
        paymentDaysTimestamps.push(closesTimestamp);
      }
    } else if (interestRate.expectedPayments === 'ONE_TIME') {
      paymentDaysTimestamps.push(closesTimestamp);
    }

    for (let i = 0; i < paymentDaysTimestamps.length; i++) {
      let outstandingPrincipal;
      let fromDateTimestamp;
      if (i === 0) {
        outstandingPrincipal = amount;
        fromDateTimestamp = openedTimestamp;
      } else {
        outstandingPrincipal = listOfPayments[i - 1].outstandingPrincipal - listOfPayments[i - 1].principalPayment;
        fromDateTimestamp = paymentDaysTimestamps[i - 1];
      }

      const toDateTimestamp = paymentDaysTimestamps[i];

      const differenceInDays = differenceInCalendarDays(new Date(toDateTimestamp), new Date(fromDateTimestamp));

      let interest = 0;
      if (interestRate.type === 'PERCENTAGE_PER_DURATION' && interestRate.isCompounding) {
        const interestPercentagePerDay = interestPerDay / 100;
        for (let i = 0; i < differenceInDays; i++) {
          interest += (outstandingPrincipal + interest) * interestPercentagePerDay;
        }
      } else if (interestRate.type === 'PERCENTAGE_PER_DURATION' && !interestRate.isCompounding) {
        const interestPercentagePerDay = interestPerDay / 100;
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
        principalPayment: differenceInDays * principalPaymentPerDay,
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

function normalizeInterestRateToDay(interestRate: Omit<IInterestRate, 'entryTimestamp' | 'revisions'>): number {
  if (interestRate.duration === 'DAY') {
    return interestRate.amount;
  } else if (interestRate.duration === 'WEEK') {
    return interestRate.amount / 7;
  } else if (interestRate.duration === 'MONTH') {
    return interestRate.amount / 30;
  } else if (interestRate.duration === 'YEAR') {
    return interestRate.amount / 360;
  } else {
    throw new Error('Error when calculating daily interest rate!');
  }
}
