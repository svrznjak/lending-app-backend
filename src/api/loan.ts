import mongoose from 'mongoose';
import {
  add,
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
import budget from './budget.js';
import paranoidCalculator from './utils/paranoidCalculator/paranoidCalculator.js';
import { transactionHelpers } from './types/transaction/transactionHelpers.js';
import { amortizationInterval, IInterestRate } from './types/interestRate/interestRateInterface.js';

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
    funds.forEach(async (fund) => {
      const recalculatedBudget = await budget.recalculateCalculatedValues({ userId: userId, budgetId: fund.budgetId });

      const avaiableFundsInBudget = paranoidCalculator.subtract(
        recalculatedBudget.calculatedTotalAmount,
        recalculatedBudget.calculatedLendedAmount,
      );
      if (avaiableFundsInBudget < fund.amount) throw new Error(`Budget (id: ${fund.budgetId}) has insufficient funds.`);
    });

    const loan: ILoan = loanHelpers.runtimeCast({
      _id: new mongoose.Types.ObjectId().toString(),
      ...input,
      notes: [],
      status: 'ACTIVE',
      calculatedChargedInterest: 0,
      calculatedPaidInterest: 0,
      calculatedTotalPaidPrincipal: 0,
    });
    user.loans.push(loan);

    const session = await global.mongoose_connection.startSession();
    try {
      session.startTransaction();
      await user.save({ session });

      // Prepare initial transactions from budgets to loan in creation
      await funds.forEach(async (fund) => {
        await transaction.transferAmountFromBudgetToLoan(
          {
            userId: userId,
            budgetId: fund.budgetId,
            loanId: loan._id,
            transactionTimestamp: transactionHelpers.validate.transactionTimestamp(new Date().getTime()),
            description: initialTransactionDescription,
            amount: fund.amount,
            entryTimestamp: transactionHelpers.validate.entryTimestamp(new Date().getTime()),
          },
          { session },
        );
      });
      await session.commitTransaction();

      // recalculate affected budgets
      funds.forEach(async (fund) => {
        await budget.recalculateCalculatedValues({ userId: userId, budgetId: fund.budgetId });
      });
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
    const loan: any = await user.loans.id(loanId);
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
        isCompounding: loan.interestRate.isCompouding,
        entryTimestamp: loan.interestRate.entryTimestamp,
        revisions: loan.interestRate.revisions.toObject(),
      },
      initialPrincipal: loan.inititalPrincipal,
      calculatedTotalPaidPrincipal: loan.calculatedTotalPaidPrincipal,
      calculatedChargedInterest: loan.calculatedChargedInterest,
      calculatedPaidInterest: loan.calculatedPaidInterest,
    } as ILoan);
    await user.save();
    return changedloan;
  },

  changeInterestRate: async function changeLoanInterestRate() {
    //TODO
    throw new Error('changeInterestRate not implemented!');
  },
  // As a lender, I want to view information and transactions of the specific loan, so that I can make informed decisions.
  // As a lender, I want to search for loan transactions, so that I can find the specific transaction.
  getTransactions: async function getLoanTransactions(loanId: string): Promise<ITransaction[]> {
    return await transaction.findTranasactionsFromAndTo({
      addressId: loanId,
      datatype: 'LOAN',
    });
  },
  makePayment: async function makeLoanPayment(
    userId: string,
    loanId: string,
    transactionTimestamp: number,
    description: string,
    amount: number,
  ): Promise<ITransaction> {
    // Get user
    const user = await UserModel.findOne({ _id: userId });
    if (user === null) throw new Error('User does not exist!');
    // Get loan
    const loan: any = await user.loans.id(loanId);
    if (loan === null) throw new Error('loan does not exist!');

    transactionHelpers.validate.transactionTimestamp(transactionTimestamp);
    transactionHelpers.validate.description(description);
    description = transactionHelpers.sanitize.description(description);
    transactionHelpers.validate.amount(amount);

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
        datatype: 'LOAN',
        addressId: loanId,
      },
      amount: amount,
      entryTimestamp: transactionHelpers.validate.entryTimestamp(new Date().getTime()),
    };
    return await transaction.add(newTransaction);
  },

  addInterest: async function addInterestToLoan(
    userId: string,
    loanId: string,
    transactionTimestamp: number,
    description: string,
    amount: number,
  ): Promise<ITransaction> {
    // Get user
    const user = await UserModel.findOne({ _id: userId });
    if (user === null) throw new Error('User does not exist!');
    // Get loan
    const loan: any = await user.loans.id(loanId);
    if (loan === null) throw new Error('loan does not exist!');

    transactionHelpers.validate.transactionTimestamp(transactionTimestamp);
    transactionHelpers.validate.description(description);
    description = transactionHelpers.sanitize.description(description);
    transactionHelpers.validate.amount(amount);

    const newTransaction: Pick<
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
    return await transaction.add(newTransaction);
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
    const loan: any = await user.loans.id(loanId);
    if (loan === null) throw new Error('loan does not exist!');
    loanHelpers.validate.status(newStatus);
    loan.status = newStatus;
    const changedloan: ILoan = loanHelpers.runtimeCast({
      _id: loan._id.toString(),
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
        revisions: loan.interestRate.revisions.toObject(),
      },
      initialPrincipal: loan.inititalPrincipal,
      calculatedTotalPaidPrincipal: loan.calculatedTotalPaidPrincipal,
      calculatedChargedInterest: loan.calculatedChargedInterest,
      calculatedPaidInterest: loan.calculatedPaidInterest,
    } as ILoan);
    await user.save();
    return changedloan;
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
  }): Promise<amortizationInterval[]> {
    // TODO: validate inputs
    const listOfPayments: amortizationInterval[] = [];
    const principalPaymentPerDay =
      amount / differenceInCalendarDays(new Date(closesTimestamp), new Date(openedTimestamp));
    const interestPercentagePerDay = normalizeInterestRateToDay(interestRate, openedTimestamp, closesTimestamp) / 100;

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
        for (let i = 0; i < differenceInDays; i++) {
          interest += (outstandingPrincipal + interest) * interestPercentagePerDay;
        }
      } else if (interestRate.type === 'PERCENTAGE_PER_DURATION' && !interestRate.isCompounding) {
        interest = outstandingPrincipal * interestPercentagePerDay * differenceInDays;
      }

      listOfPayments.push({
        fromDateTimestamp: fromDateTimestamp,
        toDateTimestamp: toDateTimestamp,
        outstandingPrincipal: outstandingPrincipal,
        interest: interest,
        principalPayment: differenceInDays * principalPaymentPerDay,
      });
    }

    if (interestRate.type === 'FIXED_PER_DURATION') {
      if (interestRate.duration === 'DAY') {
        let paymentDayTimestamp = add(new Date(openedTimestamp), { days: 1 }).getTime();
        listOfPayments.push({
          fromDateTimestamp: openedTimestamp,
          toDateTimestamp: paymentDayTimestamp,
          outstandingPrincipal: 0,
          interest: interestRate.amount,
          principalPayment: 0,
        });
        paymentDayTimestamp = add(new Date(paymentDayTimestamp), { days: 1 }).getTime();
        while (paymentDayTimestamp < closesTimestamp) {
          listOfPayments.push({
            fromDateTimestamp: listOfPayments[listOfPayments.length - 1].toDateTimestamp,
            toDateTimestamp: paymentDayTimestamp,
            outstandingPrincipal: 0,
            interest: interestRate.amount,
            principalPayment: 0,
          });
          paymentDayTimestamp = add(new Date(paymentDayTimestamp), { days: 1 }).getTime();
        }
      } else if (interestRate.duration === 'WEEK') {
        let paymentDayTimestamp = add(new Date(openedTimestamp), { weeks: 1 }).getTime();
        listOfPayments.push({
          fromDateTimestamp: openedTimestamp,
          toDateTimestamp: paymentDayTimestamp,
          outstandingPrincipal: 0,
          interest: interestRate.amount,
          principalPayment: 0,
        });
        paymentDayTimestamp = add(new Date(paymentDayTimestamp), { weeks: 1 }).getTime();
        while (paymentDayTimestamp < closesTimestamp) {
          listOfPayments.push({
            fromDateTimestamp: listOfPayments[listOfPayments.length - 1].toDateTimestamp,
            toDateTimestamp: paymentDayTimestamp,
            outstandingPrincipal: 0,
            interest: interestRate.amount,
            principalPayment: 0,
          });
          paymentDayTimestamp = add(new Date(paymentDayTimestamp), { weeks: 1 }).getTime();
        }
      } else if (interestRate.duration === 'MONTH') {
        let paymentDayTimestamp = add(new Date(openedTimestamp), { months: 1 }).getTime();
        listOfPayments.push({
          fromDateTimestamp: openedTimestamp,
          toDateTimestamp: paymentDayTimestamp,
          outstandingPrincipal: 0,
          interest: interestRate.amount,
          principalPayment: 0,
        });
        paymentDayTimestamp = add(new Date(paymentDayTimestamp), { months: 1 }).getTime();
        while (paymentDayTimestamp < closesTimestamp) {
          listOfPayments.push({
            fromDateTimestamp: listOfPayments[listOfPayments.length - 1].toDateTimestamp,
            toDateTimestamp: paymentDayTimestamp,
            outstandingPrincipal: 0,
            interest: interestRate.amount,
            principalPayment: 0,
          });
          paymentDayTimestamp = add(new Date(paymentDayTimestamp), { months: 1 }).getTime();
        }
      } else if (interestRate.duration === 'YEAR') {
        let paymentDayTimestamp = add(new Date(openedTimestamp), { years: 1 }).getTime();
        listOfPayments.push({
          fromDateTimestamp: openedTimestamp,
          toDateTimestamp: paymentDayTimestamp,
          outstandingPrincipal: 0,
          interest: interestRate.amount,
          principalPayment: 0,
        });
        paymentDayTimestamp = add(new Date(paymentDayTimestamp), { years: 1 }).getTime();
        while (paymentDayTimestamp < closesTimestamp) {
          listOfPayments.push({
            fromDateTimestamp: listOfPayments[listOfPayments.length - 1].toDateTimestamp,
            toDateTimestamp: paymentDayTimestamp,
            outstandingPrincipal: 0,
            interest: interestRate.amount,
            principalPayment: 0,
          });
          paymentDayTimestamp = add(new Date(paymentDayTimestamp), { years: 1 }).getTime();
        }
      } else if (interestRate.duration === 'FULL_DURATION') {
        listOfPayments.push({
          fromDateTimestamp: openedTimestamp,
          toDateTimestamp: closesTimestamp,
          outstandingPrincipal: 0,
          interest: interestRate.amount,
          principalPayment: 0,
        });
      }
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

function normalizeInterestRateToDay(
  interestRate: Omit<IInterestRate, 'entryTimestamp' | 'revisions'>,
  fromDateTimestamp: number,
  toDateTimestamp: number,
): number {
  if (interestRate.duration === 'DAY') {
    return interestRate.amount;
  } else if (interestRate.duration === 'WEEK') {
    return interestRate.amount / 7;
  } else if (interestRate.duration === 'MONTH') {
    return interestRate.amount / 30;
  } else if (interestRate.duration === 'YEAR') {
    return interestRate.amount / 360;
  } else if (interestRate.duration === 'FULL_DURATION') {
    return interestRate.amount / differenceInCalendarDays(new Date(fromDateTimestamp), new Date(toDateTimestamp));
  } else {
    throw new Error('Error when calculating daily interest rate!');
  }
}
