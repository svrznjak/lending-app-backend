import Loan from './loan.js';

describe('calculateExpectedInterest', () => {
  test('manualtest', async () => {
    const result = await Loan.calculateExpetedAmortization({
      openedTimestamp: 1664455532000,
      closesTimestamp: 35611256004000,
      interestRate: {
        type: 'PERCENTAGE_PER_DURATION',
        duration: 'YEAR',
        expectedPayments: 'DAILY',
        amount: 5,
        isCompounding: true,
      },
      amount: 1000000,
    });
    expect(result).toBe(0);
  });
});
