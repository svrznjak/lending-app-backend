// TODO : Types currency, language should as some point be changed into enums

import { IBudget } from '../Budget/Interface.js';
import { ILoan } from '../interfaces/Loan.js';

export interface IUser {
  _id: object;
  name: string;
  email: string;
  authId: string;
  budgets: [IBudget?];
  loans: [ILoan?];
  currency: string;
  language: string;
  subscription: ISubscription;
}

export interface ISubscription {
  revenuecatId: string;
  type: 'FREE' | 'STANDARD' | 'PREMIUM';
}

export interface IuserRegistrationInfo {
  name: string;
  email: string;
  currency: string;
  language: string;
  password: string;
}

//UserUpdateFields
export interface IuserUpdateInfo {
  name?: string;
  currency?: string;
  language?: string;
  validate(this: IuserUpdateInfo): IuserUpdateInfo;
  sanizize(this: IuserUpdateInfo): IuserUpdateInfo;
}
