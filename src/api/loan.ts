import mongoose from 'mongoose';
import UserModel from './db/model/UserModel.js';
import transaction from './transaction.js';
import { loanHelpers } from './types/loan/loanHelpers.js';
import { ILoan } from './types/loan/loanInterface.js';
import { ITransaction } from './types/transaction/transactionInterface.js';
import budget from './budget.js';
import paranoidCalculator from './utils/paranoidCalculator/paranoidCalculator.js';
import { transactionHelpers } from './types/transaction/transactionHelpers.js';

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
      const Mongo_budget = await user.budgets.id(fund.budgetId);
      if (Mongo_budget === null) throw new Error('Budget with id provided in fund does not exist!');

      budget.recalculateCalculatedValues(Mongo_budget);

      const avaiableFundsInBudget = paranoidCalculator.subtract(
        Mongo_budget.calculatedTotalAmount,
        Mongo_budget.calculatedLendedAmount,
      );
      if (avaiableFundsInBudget < fund.amount) throw new Error(`Budget (id: ${fund.budgetId}) has insufficient funds.`);
    });

    const loan: ILoan = {
      _id: new mongoose.Types.ObjectId().toString(),
      ...input,
      notes: [],
      status: 'ACTIVE',
      calculatedChargedInterest: 0,
      calculatedPaidInterest: 0,
      calculatedTotalPaidPrincipal: 0,
    };
    loanHelpers.runtimeCast(loan);
    user.push(loan);

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
            description: `Initial transfer to loan: ${input.name}`,
            amount: fund.amount,
            entryTimestamp: transactionHelpers.validate.entryTimestamp(new Date().getTime()),
          },
          { session },
        );
      });
      await session.commitTransaction();
    } catch (err) {
      console.log(err);
      await session.abortTransaction();
    }
    session.endSession();
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
        amount: loan.interestRate.amount,
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
        amount: loan.interestRate.amount,
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
  // As a lender, I want to export loan data and transactions, so that I can archive them or import them to other software.
  export: function joinLoanTransactionsIntoAccountingTable(): void {
    // TODO
  },
};
