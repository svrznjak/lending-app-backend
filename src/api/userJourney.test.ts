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
    }, 600000);

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
          totalGainsOrLossesOnEndedLoans:
            investingBudgetStats1.currentlyEarnedInterestAmount +
            5 -
            paranoidCalculator.subtract(
              paranoidCalculator.add(investingBudgetStats1.currentlyLendedPrincipalToLiveLoansAmount, 100),
              paranoidCalculator.divide(expectedPaidPrincipal, 6),
            ),
          totalAssociatedLiveLoans: 0,
          totalAssociatedLoans: 2,
          totalDefaultedPrincipal: paranoidCalculator.subtract(
            paranoidCalculator.add(investingBudgetStats1.currentlyLendedPrincipalToLiveLoansAmount, 100),
            paranoidCalculator.divide(expectedPaidPrincipal, 6),
          ),
        },
      });

      await checkBudget(budgetIds[1], {
        currentStats: {
          currentlyLendedPrincipalToLiveLoansAmount: investingBudgetStats2.currentlyLendedPrincipalToLiveLoansAmount,
          currentlyEarnedInterestAmount: investingBudgetStats2.currentlyEarnedInterestAmount + 5,
          totalGainsOrLossesOnEndedLoans:
            investingBudgetStats2.currentlyEarnedInterestAmount +
            5 -
            parseFloat(
              (
                investingBudgetStats2.currentlyLendedPrincipalToLiveLoansAmount +
                200 -
                expectedPaidPrincipal / 3
              ).toPrecision(15),
            ),
          totalAssociatedLiveLoans: 0,
          totalAssociatedLoans: 1,
          totalDefaultedPrincipal: parseFloat(
            (
              investingBudgetStats2.currentlyLendedPrincipalToLiveLoansAmount +
              200 -
              expectedPaidPrincipal / 3
            ).toPrecision(15),
          ),
        },
      });

      await checkBudget(budgetIds[2], {
        currentStats: {
          currentlyLendedPrincipalToLiveLoansAmount: investingBudgetStats3.currentlyLendedPrincipalToLiveLoansAmount,
          currentlyEarnedInterestAmount: investingBudgetStats3.currentlyEarnedInterestAmount + 0.246575342465753,
          totalGainsOrLossesOnEndedLoans: roundTo15Digits(
            investingBudgetStats3.currentlyEarnedInterestAmount +
              0.246575342465753 -
              roundTo15Digits(
                investingBudgetStats3.currentlyLendedPrincipalToLiveLoansAmount + 300 - expectedPaidPrincipal / 2,
              ),
          ),
          totalAssociatedLiveLoans: 0,
          totalAssociatedLoans: 1,
          totalDefaultedPrincipal: parseFloat(
            (
              investingBudgetStats3.currentlyLendedPrincipalToLiveLoansAmount +
              300 -
              expectedPaidPrincipal / 2
            ).toPrecision(15),
          ),
        },
      });
    }, 20000);
    test('Payment to two investing budgets if one is added later and one is added after first two are paid', async () => {
      const investingBudgetStats1 = await getBudgetStats(budgetIds[0]);
      const investingBudgetStats2 = await getBudgetStats(budgetIds[1]);
      const investingBudgetStats3 = await getBudgetStats(budgetIds[2]);

      const testingLoan = await createSimpleLoan(
        Date.now() - 3600 * 24 * 20 * 1000,
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
          totalAvailableAmount: investingBudgetStats1.totalAvailableAmount - 100,
          currentlyLendedPrincipalToLiveLoansAmount:
            investingBudgetStats1.currentlyLendedPrincipalToLiveLoansAmount + 100,
          totalLentAmount: investingBudgetStats1.totalLentAmount + 100,
        },
      });

      await loan.addPayment({
        userId,
        loanId: testingLoan._id,
        transactionTimestamp: Date.now() - 3600 * 24 * 5 * 1000,
        description: 'payment',
        amount: 50,
      });

      await checkBudget(budgetIds[0], {
        currentStats: {
          totalAvailableAmount: investingBudgetStats1.totalAvailableAmount - 50,
          currentlyLendedPrincipalToLiveLoansAmount:
            investingBudgetStats1.currentlyLendedPrincipalToLiveLoansAmount + 55,
          totalLentAmount: investingBudgetStats1.totalLentAmount + 100,
          currentlyPaidBackPrincipalAmount: investingBudgetStats1.currentlyPaidBackPrincipalAmount + 45,
          currentlyEarnedInterestAmount: investingBudgetStats1.currentlyEarnedInterestAmount + 5,
        },
      });

      await loan.addFunds({
        userId,
        budgetId: budgetIds[1],
        loanId: testingLoan._id,
        transactionTimestamp: Date.now() - 3600 * 24 * 5 * 1000,
        description: 'add funds',
        amount: 200,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 10,
          isCompounding: true,
          entryTimestamp: Date.now(),
        },
      });

      await checkLoan(testingLoan._id, {
        calculatedInvestedAmount: 300,
        calculatedOutstandingPrincipal: 255,
        calculatedTotalPaidPrincipal: 45,
        calculatedPaidInterest: 5,
      });

      await checkBudget(budgetIds[1], {
        currentStats: {
          totalAvailableAmount: investingBudgetStats2.totalAvailableAmount - 200,
          currentlyLendedPrincipalToLiveLoansAmount:
            investingBudgetStats2.currentlyLendedPrincipalToLiveLoansAmount + 200,
          totalLentAmount: investingBudgetStats2.totalLentAmount + 200,
        },
      });

      await loan.addPayment({
        userId,
        loanId: testingLoan._id,
        transactionTimestamp: Date.now() - 3600 * 24 * 3 * 1000,
        description: 'payment',
        amount: 100,
      });

      await checkLoan(testingLoan._id, {
        calculatedInvestedAmount: 300,
        calculatedOutstandingPrincipal: roundTo15Digits(156.704361134183),
        calculatedTotalPaidPrincipal: roundTo15Digits(45 + 21.2010201475291 + 77.0946187182877),
        calculatedPaidInterest: roundTo15Digits(5 + 0.366666666666667 + 1.33769446751654),
      });

      await checkBudget(budgetIds[0], {
        currentStats: {
          totalAvailableAmount: roundTo15Digits(
            investingBudgetStats1.totalAvailableAmount - 100 + 50 + 21.5676868141958,
          ),
          currentlyLendedPrincipalToLiveLoansAmount: roundTo15Digits(
            investingBudgetStats1.currentlyLendedPrincipalToLiveLoansAmount + 100 - 45 - 21.2010201475291,
          ),
          totalLentAmount: investingBudgetStats1.totalLentAmount + 100,
          currentlyPaidBackPrincipalAmount: roundTo15Digits(
            investingBudgetStats1.currentlyPaidBackPrincipalAmount + 45 + 21.2010201475291,
          ),
          currentlyEarnedInterestAmount: roundTo15Digits(
            investingBudgetStats1.currentlyEarnedInterestAmount + 5 + 0.366666666666667,
          ),
        },
      });

      await checkBudget(budgetIds[1], {
        currentStats: {
          totalAvailableAmount: roundTo15Digits(investingBudgetStats2.totalAvailableAmount - 200 + 78.4323131858042),
          currentlyLendedPrincipalToLiveLoansAmount: roundTo15Digits(
            investingBudgetStats2.currentlyLendedPrincipalToLiveLoansAmount + 200 - 77.0946187182877,
          ),
          totalLentAmount: investingBudgetStats2.totalLentAmount + 200,
          currentlyPaidBackPrincipalAmount: roundTo15Digits(
            investingBudgetStats2.currentlyPaidBackPrincipalAmount + 77.0946187182877,
          ),
          currentlyEarnedInterestAmount: roundTo15Digits(
            investingBudgetStats2.currentlyEarnedInterestAmount + 1.33769446751654,
          ),
        },
      });

      await loan.addPayment({
        userId,
        loanId: testingLoan._id,
        transactionTimestamp: Date.now() - 3600 * 24 * 1 * 1000,
        description: 'payment',
        amount: 160,
      });

      await checkLoan(testingLoan._id, {
        calculatedInvestedAmount: 300,
        calculatedOutstandingPrincipal: roundTo15Digits(-2.24826309062402),
        calculatedTotalPaidPrincipal: roundTo15Digits(45 + 21.2010201475291 + 77.0946187182877 + 158.952624224807),
        calculatedPaidInterest: roundTo15Digits(5 + 0.366666666666667 + 1.33769446751654 + 1.04737577519259),
      });

      await checkBudget(budgetIds[0], {
        currentStats: {
          totalAvailableAmount: roundTo15Digits(
            investingBudgetStats1.totalAvailableAmount + 5 + 0.366666666666667 + 0.225326532349806 + 0.0000000000001,
          ),
          currentlyLendedPrincipalToLiveLoansAmount: roundTo15Digits(
            investingBudgetStats1.currentlyLendedPrincipalToLiveLoansAmount,
          ),
          totalLentAmount: investingBudgetStats1.totalLentAmount + 100,
          currentlyPaidBackPrincipalAmount: roundTo15Digits(
            investingBudgetStats1.currentlyPaidBackPrincipalAmount + 100,
          ),
          currentlyEarnedInterestAmount: roundTo15Digits(
            investingBudgetStats1.currentlyEarnedInterestAmount + 5 + 0.366666666666667 + 0.225326532349806,
          ),
        },
      });

      await checkBudget(budgetIds[1], {
        currentStats: {
          totalAvailableAmount: roundTo15Digits(
            investingBudgetStats2.totalAvailableAmount + 1.33769446751654 + 0.822049242842784,
          ),
          currentlyLendedPrincipalToLiveLoansAmount: roundTo15Digits(
            investingBudgetStats2.currentlyLendedPrincipalToLiveLoansAmount,
          ),
          totalLentAmount: investingBudgetStats2.totalLentAmount + 200,
          currentlyPaidBackPrincipalAmount: roundTo15Digits(
            investingBudgetStats2.currentlyPaidBackPrincipalAmount + 200,
          ),
          currentlyEarnedInterestAmount: roundTo15Digits(
            investingBudgetStats2.currentlyEarnedInterestAmount + 1.33769446751654 + 0.822049242842784,
          ),
        },
      });

      // add additional investment from budget 3
      await loan.addFunds({
        userId,
        budgetId: budgetIds[2],
        loanId: testingLoan._id,
        transactionTimestamp: Date.now() - 3600 * 24 * 1 * 1000,
        description: 'add funds',
        amount: 2.24826309062402,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 10,
          isCompounding: true,
          entryTimestamp: Date.now(),
        },
      });

      await checkLoan(testingLoan._id, {
        calculatedInvestedAmount: 300 + 2.24826309062402,
        calculatedOutstandingPrincipal: 0,
        calculatedTotalPaidPrincipal: roundTo15Digits(45 + 21.2010201475291 + 77.0946187182877 + 158.952624224807),
        calculatedPaidInterest: roundTo15Digits(5 + 0.366666666666667 + 1.33769446751654 + 1.04737577519259),
      });

      await checkBudget(budgetIds[2], {
        currentStats: {
          totalAvailableAmount: investingBudgetStats3.totalAvailableAmount,
          currentlyLendedPrincipalToLiveLoansAmount: investingBudgetStats3.currentlyLendedPrincipalToLiveLoansAmount,
          totalLentAmount: investingBudgetStats3.totalLentAmount + 2.24826309062402,
        },
      });

      await loan.complete(testingLoan._id);

      await checkBudget(budgetIds[0], {
        currentStats: {
          totalAssociatedLiveLoans: investingBudgetStats1.totalAssociatedLiveLoans,
        },
      });
      await checkBudget(budgetIds[1], {
        currentStats: {
          totalAssociatedLiveLoans: investingBudgetStats2.totalAssociatedLiveLoans,
        },
      });
      await checkBudget(budgetIds[2], {
        currentStats: {
          totalAssociatedLiveLoans: investingBudgetStats3.totalAssociatedLiveLoans,
        },
      });
    }, 20000);

    test('Two investing budgets with diffirent types of interest rate (percentage / fixed)', async () => {
      const investingBudgetStats1 = await getBudgetStats(budgetIds[0]);
      const investingBudgetStats2 = await getBudgetStats(budgetIds[1]);

      const testingLoan1 = await createSimpleLoan(
        Date.now() - 3600 * 24 * 20 * 1000,
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
            amount: 100,
            interestRate: {
              type: 'FIXED_PER_DURATION',
              duration: 'DAY',
              amount: 5,
              isCompounding: false,
              entryTimestamp: Date.now(),
            },
          },
        ],
      );

      await loan.addPayment({
        userId,
        loanId: testingLoan1._id,
        transactionTimestamp: Date.now() - 3600 * 24 * 5 * 1000,
        description: 'payment',
        amount: 100,
      });

      await checkLoan(testingLoan1._id, {
        calculatedInvestedAmount: 200,
        calculatedOutstandingPrincipal: 180,
        calculatedTotalPaidPrincipal: 20,
        calculatedPaidInterest: 80,
      });

      await checkBudget(budgetIds[0], {
        currentStats: {
          totalAvailableAmount: investingBudgetStats1.totalAvailableAmount - 85,
          currentlyLendedPrincipalToLiveLoansAmount:
            investingBudgetStats1.currentlyLendedPrincipalToLiveLoansAmount + 90,
          totalLentAmount: investingBudgetStats1.totalLentAmount + 100,
          currentlyPaidBackPrincipalAmount: investingBudgetStats1.currentlyPaidBackPrincipalAmount + 10,
          currentlyEarnedInterestAmount: investingBudgetStats1.currentlyEarnedInterestAmount + 5,
        },
      });
      await checkBudget(budgetIds[1], {
        currentStats: {
          totalAvailableAmount: investingBudgetStats2.totalAvailableAmount - 15,
          currentlyLendedPrincipalToLiveLoansAmount:
            investingBudgetStats2.currentlyLendedPrincipalToLiveLoansAmount + 90,
          totalLentAmount: investingBudgetStats2.totalLentAmount + 100,
          currentlyPaidBackPrincipalAmount: investingBudgetStats2.currentlyPaidBackPrincipalAmount + 10,
          currentlyEarnedInterestAmount: roundTo15Digits(investingBudgetStats2.currentlyEarnedInterestAmount + 75),
        },
      });

      await loan.addPayment({
        userId,
        loanId: testingLoan1._id,
        transactionTimestamp: Date.now() + 3600 * 24 * 5 * 1000,
        description: 'payment',
        amount: 233,
      });

      await loan.complete(testingLoan1._id);

      await checkLoan(testingLoan1._id, {
        calculatedInvestedAmount: 200,
        calculatedOutstandingPrincipal: 0,
        calculatedTotalPaidPrincipal: 200,
        calculatedPaidInterest: 133,
      });

      await checkBudget(budgetIds[0], {
        currentStats: {
          totalAvailableAmount: investingBudgetStats1.totalAvailableAmount + 8,
          currentlyLendedPrincipalToLiveLoansAmount: investingBudgetStats1.currentlyLendedPrincipalToLiveLoansAmount,
          totalLentAmount: investingBudgetStats1.totalLentAmount + 100,
          currentlyPaidBackPrincipalAmount: investingBudgetStats1.currentlyPaidBackPrincipalAmount + 100,
          currentlyEarnedInterestAmount: investingBudgetStats1.currentlyEarnedInterestAmount + 8,
        },
      });
      await checkBudget(budgetIds[1], {
        currentStats: {
          totalAvailableAmount: investingBudgetStats2.totalAvailableAmount + 125,
          currentlyLendedPrincipalToLiveLoansAmount: investingBudgetStats2.currentlyLendedPrincipalToLiveLoansAmount,
          totalLentAmount: investingBudgetStats2.totalLentAmount + 100,
          currentlyPaidBackPrincipalAmount: investingBudgetStats2.currentlyPaidBackPrincipalAmount + 100,
          currentlyEarnedInterestAmount: roundTo15Digits(investingBudgetStats2.currentlyEarnedInterestAmount + 125),
        },
      });
    }, 20000);
    test('Two investing budgets with diffirent types of interest rate (percentage / fixed full duration)', async () => {
      const investingBudgetStats1 = await getBudgetStats(budgetIds[0]);
      const investingBudgetStats2 = await getBudgetStats(budgetIds[1]);

      const testingLoan1 = await createSimpleLoan(
        Date.now() - 3600 * 24 * 20 * 1000,
        Date.now() + 3600 * 24 * 30 * 1000,
        [
          {
            budgetId: budgetIds[0],
            amount: 100,
            interestRate: {
              type: 'PERCENTAGE_PER_DURATION',
              duration: 'WEEK',
              amount: 10,
              isCompounding: false,
              entryTimestamp: Date.now(),
            },
          },
          {
            budgetId: budgetIds[1],
            amount: 100,
            interestRate: {
              type: 'FIXED_PER_DURATION',
              duration: 'FULL_DURATION',
              amount: 50,
              isCompounding: false,
              entryTimestamp: Date.now(),
            },
          },
        ],
      );

      await loan.addPayment({
        userId,
        loanId: testingLoan1._id,
        transactionTimestamp: Date.now() - 3600 * 24 * 5 * 1000,
        description: 'payment',
        amount: 100,
      });

      await checkLoan(testingLoan1._id, {
        calculatedInvestedAmount: 200,
        calculatedOutstandingPrincipal: roundTo15Digits(200 - 28.571428571428),
        calculatedTotalPaidPrincipal: 28.5714285714286,
        calculatedPaidInterest: 71.4285714285714,
      });

      await checkBudget(budgetIds[0], {
        currentStats: {
          totalAvailableAmount: roundTo15Digits(investingBudgetStats1.totalAvailableAmount - 100 + 35.7142857142857),

          currentlyLendedPrincipalToLiveLoansAmount: roundTo15Digits(
            investingBudgetStats1.currentlyLendedPrincipalToLiveLoansAmount + 100 - 14.2857142857143,
          ),
          totalLentAmount: investingBudgetStats1.totalLentAmount + 100,
          currentlyPaidBackPrincipalAmount: roundTo15Digits(
            investingBudgetStats1.currentlyPaidBackPrincipalAmount + 14.2857142857143,
          ),
          currentlyEarnedInterestAmount: roundTo15Digits(
            investingBudgetStats1.currentlyEarnedInterestAmount + 21.4285714285714,
          ),
        },
      });
      await checkBudget(budgetIds[1], {
        currentStats: {
          totalAvailableAmount: roundTo15Digits(investingBudgetStats2.totalAvailableAmount - 100 + 64.2857142857143),
          currentlyLendedPrincipalToLiveLoansAmount: roundTo15Digits(
            investingBudgetStats2.currentlyLendedPrincipalToLiveLoansAmount + 100 - 14.2857142857143,
          ),
          totalLentAmount: investingBudgetStats2.totalLentAmount + 100,
          currentlyPaidBackPrincipalAmount: roundTo15Digits(
            investingBudgetStats2.currentlyPaidBackPrincipalAmount + 14.2857142857143,
          ),
          currentlyEarnedInterestAmount: roundTo15Digits(
            investingBudgetStats2.currentlyEarnedInterestAmount + 50.000000000001,
          ),
        },
      });

      await loan.addPayment({
        userId,
        loanId: testingLoan1._id,
        transactionTimestamp: Date.now() + 3600 * 24 * 5 * 1000,
        description: 'payment',
        amount: 183.673469387755,
      });

      await loan.complete(testingLoan1._id);

      await checkBudget(budgetIds[0], {
        currentStats: {
          totalAvailableAmount: roundTo15Digits(investingBudgetStats1.totalAvailableAmount + 33.6734693877551),

          currentlyLendedPrincipalToLiveLoansAmount: roundTo15Digits(
            investingBudgetStats1.currentlyLendedPrincipalToLiveLoansAmount,
          ),
          totalLentAmount: investingBudgetStats1.totalLentAmount + 100,
          currentlyPaidBackPrincipalAmount: roundTo15Digits(
            investingBudgetStats1.currentlyPaidBackPrincipalAmount + 100,
          ),
          currentlyEarnedInterestAmount: roundTo15Digits(
            investingBudgetStats1.currentlyEarnedInterestAmount + 33.6734693877551,
          ),
        },
      });
      await checkBudget(budgetIds[1], {
        currentStats: {
          totalAvailableAmount: roundTo15Digits(investingBudgetStats2.totalAvailableAmount + 50),
          currentlyLendedPrincipalToLiveLoansAmount: roundTo15Digits(
            investingBudgetStats2.currentlyLendedPrincipalToLiveLoansAmount,
          ),
          totalLentAmount: investingBudgetStats2.totalLentAmount + 100,
          currentlyPaidBackPrincipalAmount: roundTo15Digits(
            investingBudgetStats2.currentlyPaidBackPrincipalAmount + 100,
          ),
          currentlyEarnedInterestAmount: roundTo15Digits(
            investingBudgetStats2.currentlyEarnedInterestAmount + 50.000000000001,
          ),
        },
      });
      await checkLoan(testingLoan1._id, {
        calculatedInvestedAmount: 200,
        calculatedTotalPaidPrincipal: 200,
        calculatedPaidInterest: 83.6734693877551,
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

function roundTo15Digits(num: number): number {
  return parseFloat(num.toPrecision(15));
}
