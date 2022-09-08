import { IInterestRate } from '../interfaces/Loan.js';
import { IBudget } from './Interface.js';

export class Budget {
  _id: object;
  name: string;
  description: string;
  defaultInterestRate: IInterestRate;
  calculatedTotalAmount: number;
  calculatedLendedAmount: number;

  constructor(budget: IBudget) {
    this._id = budget._id;
    this.name = budget.name;
    this.description = budget.description;
    this.defaultInterestRate = budget.defaultInterestRate;
    this.calculatedTotalAmount = budget.calculatedTotalAmount;
    this.calculatedLendedAmount = budget.calculatedLendedAmount;
  }

  updateBudgetInfo(): Budget {
    return this;
  }

  detach(): IBudget {
    return {
      _id: this._id,
      name: this.name,
      description: this.description,
      defaultInterestRate: this.defaultInterestRate,
      calculatedTotalAmount: this.calculatedTotalAmount,
      calculatedLendedAmount: this.calculatedLendedAmount,
    };
  }
}
