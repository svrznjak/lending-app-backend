// TODO : Types currency, language should as some point be changed into enums

import { Budget } from '../interfaces/Budget.js';
import { Loan } from '../interfaces/Loan.js';

export interface User {
  _id: object;
  name: string;
  email: string;
  authId: string;
  budgets: [Budget?];
  loans: [Loan?];
  currency: string;
  language: string;
  subscription: Subscription;
}

export interface Subscription {
  revenuecatId: string;
  type: 'FREE' | 'STANDARD' | 'PREMIUM';
}

// UserCreateFields
// UserInputFields
// UserNew
export interface NewUserInput {
  name: string;
  email: string;
  currency: string;
  language: string;
  validate(this: NewUserInput): NewUserInput;
  sanizize(this: NewUserInput): NewUserInput;
}

//UserUpdateFields
export interface UpdateUserInput {
  name?: string;
  currency?: string;
  language?: string;
  validate(this: UpdateUserInput): UpdateUserInput;
  sanizize(this: UpdateUserInput): UpdateUserInput;
}
