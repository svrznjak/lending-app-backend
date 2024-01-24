/* eslint-disable jest/expect-expect */
import mongoose from 'mongoose';
import 'dotenv/config';
import { initializeUser } from './user.js';
import budget from './budget.js';
import { IBudget } from './types/budget/budgetInterface.js';
import loan from './loan.js';
import { ILoan } from './types/loan/loanInterface.js';
import transaction from './transaction.js';
import { IInterestRate } from './types/interestRate/interestRateInterface.js';
import paranoidCalculator from './utils/paranoidCalculator/paranoidCalculator.js';
let userId: string;
describe('Manual tests', () => {
  beforeAll(async () => {
    try {
      await mongoose.connect(process.env.MONGO_CLOUD_TEST_URI);

      // clear all collections
      const collections = await mongoose.connection.db.collections();
      for (const collection of collections) {
        await collection.deleteMany({});
      }
    } catch (err) {
      throw new Error('Failed to connect to MongoDB');
    }
  });
  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Create user, budget and loan', () => {
    let budgetId;

    /**
     * Test if we can create a new user
     * Check if the user has a default budget
     */
    test('Create new user and check default budget', async () => {
      const newUser = await initializeUser(
        {
          authId: 'test',
          name: 'New User name',
          email: 'test@gmail.com',
          currency: 'EUR',
          language: 'sl-SI',
          formattingLocale: 'sl-SI',
        },
        'my budget',
        'my default budget',
        1000,
        'my first investment',
      );

      expect(newUser).toBeDefined();
      expect(newUser).toHaveProperty('_id');
      expect(newUser.name).toBe('New User name');

      userId = newUser._id;

      const usersBudget = await budget.getAllFromUser({ userId: userId });
      expect(usersBudget).toHaveLength(1);
      await checkBudget(usersBudget[0]._id, {
        name: 'my budget',
        currentStats: {
          totalInvestedAmount: 1000,
          totalAvailableAmount: 1000,
        },
      });

      budgetId = usersBudget[0]._id;
    });

    /**
     * Test if we can create a new loan
     */
    test('Create new loan and check loan and budget', async () => {
      const newLoan = await loan.create(
        userId,
        {
          name: 'my loan',
          description: 'my loan description',
          customerId: undefined,
          openedTimestamp: Date.now(),
          closesTimestamp: Date.now() + 3600 * 24 * 30,
          paymentFrequency: {
            occurrence: 'MONTHLY',
            isStrict: false,
            entryTimestamp: Date.now(),
          },
          expectedPayments: [],
        },
        [
          {
            budgetId: budgetId,
            amount: 500,
            interestRate: {
              type: 'PERCENTAGE_PER_DURATION',
              duration: 'MONTH',
              amount: 10,
              isCompounding: true,
              entryTimestamp: Date.now(),
            },
          },
        ],
        'Initial investment',
      );

      expect(newLoan).toBeDefined();
      expect(newLoan).toHaveProperty('_id');

      checkLoan(newLoan._id, {
        name: 'my loan',
      });
      await checkBudget(budgetId, {
        currentStats: {
          totalInvestedAmount: 1000,
          totalAvailableAmount: 500,
        },
      });
    });
  });

  describe('Budget can add and withdraw money, but can not be negative', () => {
    let budgetId;
    let transactionToDelete;

    test('Create new budget', async () => {
      const newBudget = await budget.create(
        userId,
        {
          name: 'my budget',
          description: 'my budget description',
          defaultInterestRate: {
            type: 'PERCENTAGE_PER_DURATION',
            duration: 'MONTH',
            amount: 10,
            isCompounding: true,
            entryTimestamp: Date.now(),
          },
          defaultPaymentFrequency: {
            occurrence: 'MONTHLY',
            isStrict: false,
            entryTimestamp: Date.now(),
          },
        },
        1000,
        'first investment',
      );

      expect(newBudget).toBeDefined();
      expect(newBudget).toHaveProperty('_id');

      budgetId = newBudget._id;

      await checkBudget(budgetId, {
        name: 'my budget',
        currentStats: {
          totalInvestedAmount: 1000,
          totalAvailableAmount: 1000,
        },
      });
    });

    test('Add money to budget', async () => {
      const newTransaction = await budget.addFundsFromOutside({
        userId,
        budgetId,
        transactionTimestamp: Date.now() - 3600,
        description: 'add funds',
        amount: 200,
      });

      expect(newTransaction).toBeDefined();

      transactionToDelete = newTransaction._id;
      await checkBudget(budgetId, {
        currentStats: {
          totalInvestedAmount: 1200,
          totalAvailableAmount: 1200,
        },
      });
    });
    test('Withdraw money from budget', async () => {
      const newTransaction = await budget.withdrawFundsToOutside({
        userId,
        budgetId,
        transactionTimestamp: Date.now() - 3000,
        description: 'withdraw funds',
        amount: 1100,
      });

      expect(newTransaction).toBeDefined();

      await checkBudget(budgetId, {
        currentStats: {
          totalInvestedAmount: 1200,
          totalWithdrawnAmount: 1100,
          totalAvailableAmount: 100,
        },
      });
    });
    test('Withdraw money from budget, but not more than available', async () => {
      try {
        await budget.withdrawFundsToOutside({
          userId,
          budgetId,
          transactionTimestamp: Date.now() - 2900,
          description: 'withdraw funds',
          amount: 200,
        });
      } catch (err) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(err.message).toBe('Transaction creation failed!');
      }

      await checkBudget(budgetId, {
        currentStats: {
          totalInvestedAmount: 1200,
          totalWithdrawnAmount: 1100,
          totalAvailableAmount: 100,
        },
      });
    });

    test('It throws an error if we try to delete a transaction that would make the budget negative', async () => {
      try {
        await transaction.delete(transactionToDelete);
      } catch (err) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(err.message).toBe('Budget funds cannot be negative!');
      }

      await checkBudget(budgetId, {
        currentStats: {
          totalInvestedAmount: 1200,
          totalWithdrawnAmount: 1100,
          totalAvailableAmount: 100,
        },
      });
    });

    test('Budget can still recieve more money (everything is ok)', async () => {
      const newTransaction = await budget.addFundsFromOutside({
        userId,
        budgetId,
        transactionTimestamp: Date.now() - 2100,
        description: 'add funds',
        amount: 200,
      });

      expect(newTransaction).toBeDefined();

      await checkBudget(budgetId, {
        currentStats: {
          totalInvestedAmount: 1400,
          totalWithdrawnAmount: 1100,
          totalAvailableAmount: 300,
        },
      });
    });
  });

  describe('Testing loan', () => {
    const budgetIds: string[] = [];
    test('Creating 3 budgets for testing', async () => {
      budgetIds.push(
        (
          await budget.create(
            userId,
            {
              name: 'my budget 1',
              description: 'my budget description',
              defaultInterestRate: {
                type: 'PERCENTAGE_PER_DURATION',
                duration: 'MONTH',
                amount: 10,
                isCompounding: true,
                entryTimestamp: Date.now(),
              },
              defaultPaymentFrequency: {
                occurrence: 'MONTHLY',
                isStrict: false,
                entryTimestamp: Date.now(),
              },
            },
            1000,
            'first investment',
          )
        )._id,
      );
      budgetIds.push(
        (
          await budget.create(
            userId,
            {
              name: 'my budget 2',
              description: 'my budget description',
              defaultInterestRate: {
                type: 'PERCENTAGE_PER_DURATION',
                duration: 'MONTH',
                amount: 10,
                isCompounding: true,
                entryTimestamp: Date.now(),
              },
              defaultPaymentFrequency: {
                occurrence: 'MONTHLY',
                isStrict: false,
                entryTimestamp: Date.now(),
              },
            },
            2000,
            'first investment',
          )
        )._id,
      );
      budgetIds.push(
        (
          await budget.create(
            userId,
            {
              name: 'my budget 3',
              description: 'my budget description',
              defaultInterestRate: {
                type: 'PERCENTAGE_PER_DURATION',
                duration: 'MONTH',
                amount: 10,
                isCompounding: true,
                entryTimestamp: Date.now(),
              },
              defaultPaymentFrequency: {
                occurrence: 'MONTHLY',
                isStrict: false,
                entryTimestamp: Date.now(),
              },
            },
            3000,
            'first investment',
          )
        )._id,
      );

      expect(budgetIds).toHaveLength(3);
    });
    test('Payment of loan with single investing budget', async () => {
      const investingBudgetStats = await getBudgetStats(budgetIds[0]);

      const testingLoan = await createSimpleLoan(
        Date.now() - 3600 * 24 * 15 * 1000,
        Date.now() + 3600 * 24 * 30 * 1000,
        [
          {
            budgetId: budgetIds[0],
            amount: 100,
            interestRate: {
              type: 'PERCENTAGE_PER_DURATION',
              duration: 'MONTH',
              amount: 10,
              isCompounding: false,
              entryTimestamp: Date.now(),
            },
          },
        ],
      );

      await checkBudget(budgetIds[0], {
        currentStats: {
          totalAvailableAmount: investingBudgetStats.totalAvailableAmount - 100,
          currentlyLendedPrincipalToLiveLoansAmount:
            investingBudgetStats.currentlyLendedPrincipalToLiveLoansAmount + 100,
          totalAssociatedLiveLoans: 1,
          totalAssociatedLoans: 1,
        },
      });

      await loan.addPayment({
        userId,
        loanId: testingLoan._id,
        transactionTimestamp: Date.now(),
        description: 'payment',
        amount: 50,
      });

      await checkLoan(testingLoan._id, {
        calculatedInvestedAmount: 100,
        calculatedOutstandingPrincipal: 55,
        calculatedTotalPaidPrincipal: 45,
        calculatedPaidInterest: 5,
      });
      await checkBudget(budgetIds[0], {
        currentStats: {
          totalAvailableAmount: investingBudgetStats.totalAvailableAmount - 50,
          currentlyLendedPrincipalToLiveLoansAmount:
            investingBudgetStats.currentlyLendedPrincipalToLiveLoansAmount + 55,
          currentlyEarnedInterestAmount: investingBudgetStats.currentlyEarnedInterestAmount + 5,
        },
      });

      await loan.addPayment({
        userId,
        loanId: testingLoan._id,
        transactionTimestamp: Date.now() + 1000,
        description: 'payment',
        amount: 55,
      });

      await checkLoan(testingLoan._id, {
        calculatedInvestedAmount: 100,
        calculatedOutstandingPrincipal: 0,
        calculatedTotalPaidPrincipal: 100,
        calculatedPaidInterest: 5,
      });
      await checkBudget(budgetIds[0], {
        currentStats: {
          totalAvailableAmount: investingBudgetStats.totalAvailableAmount + 5,
          currentlyLendedPrincipalToLiveLoansAmount: investingBudgetStats.currentlyLendedPrincipalToLiveLoansAmount,
          currentlyEarnedInterestAmount: investingBudgetStats.currentlyEarnedInterestAmount + 5,
        },
      });

      await loan.complete(testingLoan._id);

      await checkLoan(testingLoan._id, {
        calculatedInvestedAmount: 100,
        calculatedOutstandingPrincipal: 0,
        calculatedTotalPaidPrincipal: 100,
        calculatedPaidInterest: 5,
      });
      await checkBudget(budgetIds[0], {
        currentStats: {
          totalAvailableAmount: investingBudgetStats.totalAvailableAmount + 5,
          currentlyLendedPrincipalToLiveLoansAmount: investingBudgetStats.currentlyLendedPrincipalToLiveLoansAmount,
          currentlyEarnedInterestAmount: investingBudgetStats.currentlyEarnedInterestAmount + 5,
          totalGainsOrLossesOnEndedLoans: 5,
          totalAssociatedLiveLoans: 0,
          totalAssociatedLoans: 1,
        },
      });
    }, 20000);

    test('Payment of loan with multiple investing budgets', async () => {
      const investingBudgetStats1 = await getBudgetStats(budgetIds[0]);
      const investingBudgetStats2 = await getBudgetStats(budgetIds[1]);
      const investingBudgetStats3 = await getBudgetStats(budgetIds[2]);

      const testingLoan = await createSimpleLoan(
        Date.now() - 3600 * 24 * 15 * 1000,
        Date.now() + 3600 * 24 * 30 * 1000,
        [
          {
            budgetId: budgetIds[0],
            amount: 100,
            interestRate: {
              type: 'PERCENTAGE_PER_DURATION',
              duration: 'MONTH',
              amount: 10,
              isCompounding: false,
              entryTimestamp: Date.now(),
            },
          },
          {
            budgetId: budgetIds[1],
            amount: 200,
            interestRate: {
              type: 'PERCENTAGE_PER_DURATION',
              duration: 'MONTH',
              amount: 5,
              isCompounding: false,
              entryTimestamp: Date.now(),
            },
          },
          {
            budgetId: budgetIds[2],
            amount: 300,
            interestRate: {
              type: 'PERCENTAGE_PER_DURATION',
              duration: 'YEAR',
              amount: 2,
              isCompounding: false,
              entryTimestamp: Date.now(),
            },
          },
        ],
      );

      await checkBudget(budgetIds[0], {
        currentStats: {
          totalAvailableAmount: investingBudgetStats1.totalAvailableAmount - 100,
          currentlyLendedPrincipalToLiveLoansAmount:
            investingBudgetStats1.currentlyLendedPrincipalToLiveLoansAmount + 100,
        },
      });
      await checkBudget(budgetIds[1], {
        currentStats: {
          totalAvailableAmount: investingBudgetStats2.totalAvailableAmount - 200,
          currentlyLendedPrincipalToLiveLoansAmount:
            investingBudgetStats2.currentlyLendedPrincipalToLiveLoansAmount + 200,
        },
      });
      await checkBudget(budgetIds[2], {
        currentStats: {
          totalAvailableAmount: investingBudgetStats3.totalAvailableAmount - 300,
          currentlyLendedPrincipalToLiveLoansAmount:
            investingBudgetStats3.currentlyLendedPrincipalToLiveLoansAmount + 300,
        },
      });

      await loan.addPayment({
        userId,
        loanId: testingLoan._id,
        transactionTimestamp: Date.now(),
        description: 'payment',
        amount: 300,
      });

      const expectedPaidInterest = 10.2465753424658;

      await checkLoan(testingLoan._id, {
        calculatedInvestedAmount: 600,
        calculatedOutstandingPrincipal: paranoidCalculator.add(300, expectedPaidInterest),
        calculatedTotalPaidPrincipal: paranoidCalculator.subtract(300, expectedPaidInterest),
        calculatedPaidInterest: expectedPaidInterest,
      });

      const expectedPaidPrincipal = paranoidCalculator.subtract(300, expectedPaidInterest);

      await checkBudget(budgetIds[0], {
        currentStats: {
          totalAvailableAmount: parseFloat(
            (investingBudgetStats1.totalAvailableAmount - 100 + expectedPaidPrincipal / 6 + 5).toPrecision(15),
          ),
          currentlyLendedPrincipalToLiveLoansAmount: paranoidCalculator.subtract(
            paranoidCalculator.add(investingBudgetStats1.currentlyLendedPrincipalToLiveLoansAmount, 100),
            paranoidCalculator.divide(expectedPaidPrincipal, 6),
          ),
          currentlyEarnedInterestAmount: investingBudgetStats1.currentlyEarnedInterestAmount + 5,
        },
      });

      await checkBudget(budgetIds[1], {
        currentStats: {
          totalAvailableAmount: parseFloat(
            (investingBudgetStats2.totalAvailableAmount - 200 + expectedPaidPrincipal / 3 + 5).toPrecision(15),
          ),
          currentlyLendedPrincipalToLiveLoansAmount: parseFloat(
            (
              investingBudgetStats2.currentlyLendedPrincipalToLiveLoansAmount +
              200 -
              expectedPaidPrincipal / 3
            ).toPrecision(15),
          ),
          currentlyEarnedInterestAmount: investingBudgetStats2.currentlyEarnedInterestAmount + 5,
        },
      });

      await checkBudget(budgetIds[2], {
        currentStats: {
          totalAvailableAmount: parseFloat(
            (
              investingBudgetStats3.totalAvailableAmount -
              300 +
              expectedPaidPrincipal / 2 +
              0.246575342465753
            ).toPrecision(15),
          ),
          currentlyLendedPrincipalToLiveLoansAmount: parseFloat(
            (
              investingBudgetStats3.currentlyLendedPrincipalToLiveLoansAmount +
              300 -
              expectedPaidPrincipal / 2
            ).toPrecision(15),
          ),
          currentlyEarnedInterestAmount: parseFloat(
            (investingBudgetStats3.currentlyEarnedInterestAmount + 0.246575342465753).toPrecision(15),
          ),
        },
      });

      await loan.default(testingLoan._id);

      await checkBudget(budgetIds[0], {
        currentStats: {
          currentlyLendedPrincipalToLiveLoansAmount: investingBudgetStats1.currentlyLendedPrincipalToLiveLoansAmount,
          currentlyEarnedInterestAmount: investingBudgetStats1.currentlyEarnedInterestAmount + 5,
          totalGainsOrLossesOnEndedLoans: 5,
          totalAssociatedLiveLoans: 0,
          totalAssociatedLoans: 2,
          totalDefaultedPrincipal: paranoidCalculator.subtract(
            paranoidCalculator.add(investingBudgetStats1.currentlyLendedPrincipalToLiveLoansAmount, 100),
            paranoidCalculator.divide(expectedPaidPrincipal, 6),
          ),
        },
      });
    }, 20000);
  });
});

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

async function checkBudget(budgetId: string, expectedBudgetInfo: DeepPartial<IBudget>): Promise<void> {
  const storedBudget = await budget.getOneFromUser({ userId, budgetId });
  expect(storedBudget).toBeDefined();
  const { ...budgetInfo } = storedBudget;
  expect(budgetInfo).toMatchObject(expectedBudgetInfo);
}

async function checkLoan(loanId: string, expectedLoanInfo: DeepPartial<ILoan>): Promise<void> {
  const storedLoan = await loan.getOneFromUser({ userId, loanId });
  expect(storedLoan).toBeDefined();
  const { ...loanInfo } = storedLoan;
  expect(loanInfo).toMatchObject(expectedLoanInfo);
}

async function getBudgetStats(budgetId: string): Promise<IBudget['currentStats']> {
  const storedBudget = await budget.getOneFromUser({ userId, budgetId });
  expect(storedBudget).toBeDefined();
  return storedBudget.currentStats;
}

interface fund {
  budgetId: string;
  amount: number;
  interestRate: IInterestRate;
}
async function createSimpleLoan(openedTimestamp: number, closesTimestamp, funds: fund[]): Promise<ILoan> {
  return loan.create(
    userId,
    {
      name: 'my loan',
      description: 'my loan description',
      customerId: undefined,
      openedTimestamp,
      closesTimestamp,
      paymentFrequency: {
        occurrence: 'MONTHLY',
        isStrict: false,
        entryTimestamp: Date.now(),
      },
      expectedPayments: [],
    },
    funds,
    'Initial investment',
  );
}
