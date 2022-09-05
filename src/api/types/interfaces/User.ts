// TODO : Types currency, language should as some point be changed into enums

import { Budget } from './Budget.js';
import { Loan } from './Loan.js';

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

export interface NewUserInput {
  name: string;
  email: string;
  currency: string;
  language: string;
}

export interface UpdateUserInput {
  name?: string;
  currency?: string;
  language?: string;
}
