export interface ILoan {
  _id: object;
  name: string;
  description: string;
  notes: [INote];
  startedOn: number;
  closesAt: number;
  interestRate: IInterestRate;
  initialPrincipal: number;
  calculatedTotalPaidPrincipal: number;
  calculatedChargedInterest: number;
  calculatedPaidInterest: number;
}
export interface INote {
  _id: object;
  content: string;
  createdAtTimestamp: number;
  revisions: INote;
}
export interface IInterestRate {
  type: 'PERCENTAGE_PER_DURATION' | 'FIXED_PER_DURATION';
  duration: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'FULL_DURATION';
  amount: number;
  entryTimestamp: number;
  revisions: [IInterestRate?];
}
