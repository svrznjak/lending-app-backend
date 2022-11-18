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
      const Mongo_budget: any = await BudgetModel.findOne({ _id: funds[i].budgetId });
      if (Mongo_budget === null) throw new Error('budget does not exist!');

      const recalculatedBudget = await Budget.recalculateCalculatedValues({ Mongo_budget: Mongo_budget });

      if (recalculatedBudget.calculatedTotalAvailableAmount < funds[i].amount)
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
        const Mongo_budget: any = await BudgetModel.findOne({ _id: fund.budgetId });
        if (Mongo_budget === null) throw new Error('budget does not exist!');

        await Budget.recalculateCalculatedValues({ Mongo_budget: Mongo_budget });
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
      const recalculatedLoan = await this.recalculateCalculatedValues({ Mongo_loan: Mongo_loan });
      LoanCache.setCachedItem({ itemId: loanId, value: recalculatedLoan });
      return recalculatedLoan;
    }
  },

  getAllFromUser: async function getLoans({ userId }: { userId: string }): Promise<ILoan[]> {
    const Mongo_loans: any = await LoanModel.find({ userId: userId }).exec();
    const returnValue: ILoan[] = [];
    for (let i = 0; i < Mongo_loans.length; i++) {
      const LOAN_ID = Mongo_loans[i]._id.toString();
      if (LoanCache.getCachedItem({ itemId: LOAN_ID })) {
        returnValue.push(LoanCache.getCachedItem({ itemId: LOAN_ID }) as ILoan);
      } else {
        const recalculatedLoan = await this.recalculateCalculatedValues({ Mongo_loan: Mongo_loans[i] });
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

    const Mongo_budget: any = await BudgetModel.findOne({ _id: budgetId });
    if (Mongo_budget === null) throw new Error('budget does not exist!');

    transactionHelpers.validate.description(description);
    description = transactionHelpers.sanitize.description(description);
    transactionHelpers.validate.amount(amount);
    transactionHelpers.validate.transactionTimestamp(transactionTimestamp);
    if (transactionTimestamp < Mongo_loan.openedTimestamp)
      throw new Error('Transaction should not happen before loan start');
    if (transactionTimestamp > new Date().getTime()) throw new Error('Transaction should not happen in the future');

    const newTransaction = await transaction.transferAmountFromLoanToBudget({
      userId: userId,
      loanId: loanId,
      budgetId: budgetId,
      transactionTimestamp: transactionTimestamp,
      description: description,
      amount: amount,
      entryTimestamp: transactionHelpers.validate.entryTimestamp(new Date().getTime()),
    });

    await Budget.recalculateCalculatedValues({ Mongo_budget: Mongo_budget });
    LoanCache.setCachedItem({
      itemId: loanId,
      value: await this.recalculateCalculatedValues({ Mongo_loan: Mongo_loan }),
    });

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

    const Mongo_budget: any = await BudgetModel.findOne({ _id: budgetId });
    if (Mongo_budget === null) throw new Error('budget does not exist!');

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
    await Budget.recalculateCalculatedValues({ Mongo_budget: Mongo_budget });
    LoanCache.setCachedItem({
      itemId: loanId,
      value: await this.recalculateCalculatedValues({ Mongo_loan: Mongo_loan }),
    });
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
    const Mongo_loan: any = await LoanModel.findOne({ _id: loanId });
    if (Mongo_loan === null) throw new Error('loan does not exist!');

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

    LoanCache.setCachedItem({
      itemId: loanId,
      value: await this.recalculateCalculatedValues({ Mongo_loan: Mongo_loan }),
    });
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

  getCalculatedValuesAtTimestamp: async function getLoanCalculatedValuesAtTimestamp({
    loanId,
    interestRate,
    timestampLimit,
  }: {
    loanId: string;
    interestRate: IInterestRate;
    timestampLimit: number;
  }): Promise<Pick<ILoan, 'calculatedTotalPaidPrincipal' | 'calculatedChargedInterest' | 'calculatedPaidInterest'>> {
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
        if (TRANSACTION.principalCharge > 0) calculatedTotalPaidPrincipal += TRANSACTION.principalCharge;
        if (TRANSACTION.interestCharge > 0) calculatedChargedInterest += TRANSACTION.interestCharge;
        if (TRANSACTION.interestCharge < 0) calculatedPaidInterest -= TRANSACTION.interestCharge;
      }
    }
    return {
      calculatedChargedInterest,
      calculatedPaidInterest,
      calculatedTotalPaidPrincipal,
    };
  },
  recalculateCalculatedValues: async function recalculateLoanCalculatedValues({
    Mongo_loan,
  }: {
    Mongo_loan: any;
  }): Promise<ILoan> {
    const NOW_TIMESTAMP = new Date().getTime();
    const CALCULATED_VALUES_UNTIL_NOW = await this.getCalculatedValuesAtTimestamp({
      loanId: Mongo_loan._id.toString(),
      interestRate: Mongo_loan.interestRate,
      timestampLimit: NOW_TIMESTAMP,
    });
    Mongo_loan.calculatedTotalPaidPrincipal = CALCULATED_VALUES_UNTIL_NOW.calculatedTotalPaidPrincipal;
    Mongo_loan.calculatedChargedInterest = CALCULATED_VALUES_UNTIL_NOW.calculatedChargedInterest;
    Mongo_loan.calculatedPaidInterest = CALCULATED_VALUES_UNTIL_NOW.calculatedPaidInterest;
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
