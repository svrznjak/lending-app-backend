export interface Loan {
  id: string;
  name: string;
  description: string;
  notes: [Note];
  startedOn: number;
  closesAt: number;
  interestRate: InterestRate;
  initialPrincipal: number;
  calculatedRemainingPrincipal: number;
  calculatedTotalPaidPrincipal: number;
  calculatedChargedInterest: number;
  calculatedPaidInterest: number;
}
export interface Note {
  id: string;
  content: string;
  createdAtTimestamp: number;
  revisions: Note;
}
export interface InterestRate {
  type: 'percentagePerDuration' | 'fixedPerDuration';
  duration: 'day' | 'week' | 'month' | 'year' | 'fullDuration';
  amount: number;
  entryTimestamp: number;
  revisions: InterestRate;
}
