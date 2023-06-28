export interface IInterestRate {
  type: 'PERCENTAGE_PER_DURATION' | 'FIXED_PER_DURATION';
  duration: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'FULL_DURATION';
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
