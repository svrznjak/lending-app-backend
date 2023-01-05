import Loan, { calculateLoanPaymentAmount, calculateEquivalentInterestRate } from './loan.js';

describe('calculateExpectedInterest', () => {
  test('manualtest', async () => {
    const result = await Loan.calculateExpetedAmortization({
      openedTimestamp: 1640995200000,
      closesTimestamp: 1672444800000,
      interestRate: {
        type: 'PERCENTAGE_PER_DURATION',
        duration: 'YEAR',
        amount: 5,
        expectedPayments: 'MONTHLY',
        isCompounding: true,
      },
      amount: 100000,
    });
    const interest = result.reduce((total, amortizationInterval) => {
      return total + amortizationInterval.interest;
    }, 0);
    console.log(interest);
    expect(interest).toBe(932.56);
  });
});

describe('calculateLoanPaymentAmount', () => {
  test('It throws is any of inputs are negative', async () => {
    expect(() => calculateLoanPaymentAmount(-1000, 0.002, 10)).toThrow();
    expect(() => calculateLoanPaymentAmount(1000, -0.002, 10)).toThrow();
    expect(() => calculateLoanPaymentAmount(1000, 0.002, -10)).toThrow();
  });
  test('It returns correct value on couple of inputs', async () => {
    // Loan amount: 1000, Interest: 5% per year, # of payments: 12
    expect(parseFloat(calculateLoanPaymentAmount(1000, 0.05 / 12, 12).toFixed(2))).toEqual(85.61);
    // Loan amount: 1000, Interest: 10% per year, # of payments: 1
    expect(parseFloat(calculateLoanPaymentAmount(1000, 0.1 / 12, 1).toFixed(2))).toEqual(1008.33);
    // Loan amount: 14952.13, Interest: 5% per year, # of payments: 120
    expect(parseFloat(calculateLoanPaymentAmount(14952.13, 0.05 / 12, 120).toFixed(2))).toEqual(158.59);
    // Loan amount: 27952.03, Interest: 3.5% per year, # of payments: 212
    expect(parseFloat(calculateLoanPaymentAmount(27952.03, 0.035 / 12, 212).toFixed(2))).toEqual(176.97);
    // Loan amount: 1302.03, Interest: 3% per month, # of payments: 6
    expect(parseFloat(calculateLoanPaymentAmount(1302.03, 0.03, 6).toFixed(2))).toEqual(240.35);
  });
});

describe('calculateEquivalentInterestRate', () => {
  test('It throws is any of inputs are negative', async () => {
    expect(() => calculateEquivalentInterestRate(-0.05, 12, 12)).toThrow();
    expect(() => calculateEquivalentInterestRate(0.05, -12, 12)).toThrow();
    expect(() => calculateEquivalentInterestRate(0.05, 12, -12)).toThrow();
  });
  test('It returns correct value on couple of inputs', async () => {
    // Interest rate per period: 4%, # of compoundings per period: 12, # of payments per period: 4
    expect(parseFloat(calculateEquivalentInterestRate(0.04, 12, 4).toFixed(7))).toEqual(0.0401335);
    // Interest rate per period: 3%, # of compoundings per period: 12, # of payments per period: 12
    expect(parseFloat(calculateEquivalentInterestRate(0.03, 12, 12).toFixed(7))).toEqual(0.03);
    // Interest rate per period: 3%, # of compoundings per period: 365, # of payments per period: 12
    expect(parseFloat(calculateEquivalentInterestRate(0.03, 365, 12).toFixed(7))).toEqual(0.0300363);
  });
});
