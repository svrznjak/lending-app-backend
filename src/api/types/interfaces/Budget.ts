import { InterestRate } from './Loan.js';

export interface Budget {
  _id: object;
  name: string;
  description: string;
  defaultInterestRate: InterestRate;
  calculatedTotalAmount: number;
  calculatedLendedAmount: number;
}
