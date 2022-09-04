// TODO : Types currency, language, timezone should as some point be changed into enums

import { Budget } from './Budget.js';
import { Loan } from './Loan.js';

export interface User {
  _id: object;
  name: string;
  email: string;
  firebaseId: string;
  budgets: [Budget?];
  loans: [Loan?];
  currency: string;
  language: string;
  timezone: string;
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
  timezone: string;
}

export interface UpdateUserInput {
  name?: string;
  currency?: string;
  language?: string;
  timezone?: string;
}
