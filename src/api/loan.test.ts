import Loan from './loan.js';

describe('calculateExpectedInterest', () => {
  test('manualtest', async () => {
    const result = await Loan.calculateExpetedAmortization({
      openedTimestamp: 1664455532000,
      closesTimestamp: 1669726344000,
      interestRate: {
        type: 'FIXED_PER_DURATION',
        duration: 'FULL_DURATION',
        amount: 100,
        expectedPayments: 'WEEKLY',
        isCompounding: false,
      },
      amount: 100,
    });
    expect(result).toBe(0);
  });
});
