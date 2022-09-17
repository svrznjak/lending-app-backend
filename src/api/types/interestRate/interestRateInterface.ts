export interface IInterestRate {
  type: 'PERCENTAGE_PER_DURATION' | 'FIXED_PER_DURATION';
  duration: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'FULL_DURATION';
  amount: number;
  entryTimestamp: number;
  revisions?: IInterestRate;
}
