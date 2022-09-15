import UserModel from './db/model/UserModel.js';
import { IBudget } from './types/budget/budgetInterface.js';
import { IUser } from './types/user/userInterface.js';
// As a lender, I want to create a budget, so that I can categorize my investments.

export async function createBudget(
  userId: Pick<IUser, '_id'>,
  budget: Omit<IBudget, '_id, calculatedTotalAmount, calculatedLendedAmount'>,
): Promise<IBudget> {
  const userFromDB = await UserModel.findOne({ _id: userId });
  userFromDB.budgets.push(budget);
  await userFromDB.save();
  const newBudget = userFromDB.budgets[userFromDB.budgets.length - 1];
  return newBudget.toObject();
}
// As a lender, I want to view a list of budgets with basic information, so that I can have a general overview of my investments.
export function getBudgets(): void {
  return;
}

// As a lender, I want to add funds to the budget, so that I can later assign them to loans.
export function addAmountToBudget(): void {
  return;
}

// As a lender, I want to withdraw funds from the budget, so that I can make use of interest or move it to another budget.
export function withdrawAmountFromBudget(): void {
  return;
}

// As a lender, I want to view transactions related to budget, so that I can make decisions.
export function getBudgetTransactions(): void {
  return;
}

// As a lender, I want to export budget data and transactions, so that I can archive them or import them to other software.
export function joinBudetTransactionsIntoAccountingTable(): void {
  return;
}

// As a lender, I want to change the existing budget name and description, so that I can set a more fitting name and description.
// As a lender, I want to change the default interest rate, so that I can adapt my budget to current market conditions.
export function updateBudgetInfo(): void {
  return;
}
