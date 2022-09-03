export interface Loan {
  _id: object;
  name: string;
  description: string;
  notes: [Note];
  startedOn: number;
  closesAt: number;
  interestRate: InterestRate;
  initialPrincipal: number;
  calculatedTotalPaidPrincipal: number;
  calculatedChargedInterest: number;
  calculatedPaidInterest: number;
}
export interface Note {
  _id: object;
  content: string;
  createdAtTimestamp: number;
  revisions: Note;
}
export interface InterestRate {
  type: 'PERCENTAGE_PER_DURATION' | 'FIXED_PER_DURATION';
  duration: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'FULL_DURATION';
  amount: number;
  entryTimestamp: number;
  revisions: InterestRate;
}
