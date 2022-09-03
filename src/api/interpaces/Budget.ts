import { InterestRate } from './Loan.js';

export interface Budget {
  id: string;
  name: string;
  description: string;
  defaultInterestRate: InterestRate;
  calculatedTotalAmount: number;
  calculatedLendedAmount: number;
}
