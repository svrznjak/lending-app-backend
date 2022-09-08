import { IInterestRate } from '../interfaces/Loan.js';

export interface IBudget {
  _id: object;
  name: string;
  description: string;
  defaultInterestRate: IInterestRate;
  calculatedTotalAmount: number;
  calculatedLendedAmount: number;
}
