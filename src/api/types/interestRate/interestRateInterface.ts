export interface IInterestRate {
  type: 'PERCENTAGE_PER_DURATION' | 'FIXED_PER_DURATION';
  duration: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'FULL_DURATION';
  expectedPayments: 'ONE_TIME' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  amount: number;
  isCompounding: boolean;
  entryTimestamp: number;
  revisions?: IInterestRate;
}

export interface IAmortizationInterval {
  fromDateTimestamp: number;
  toDateTimestamp: number;
  outstandingPrincipal: number;
  interest: number;
  principalPayment: number;
}

export interface ITransactionInterval {
  fromDateTimestamp: number;
  toDateTimestamp: number;
  interestCharge: number;
  principalCharge: number;
  outstandingPrincipal: number;
  outstandingInterest: number;
}
