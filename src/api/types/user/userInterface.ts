export interface IUser {
  _id: string;
  name: string;
  email: string;
  authId: string;
  currency: string;
  language: string;
  subscription: ISubscription;
  notificationTokens: string[];
}

export interface ISubscription {
  revenuecatId: string;
  type: 'FREE' | 'STANDARD' | 'PREMIUM';
}

export interface IUserInitializeInfo {
  authId: string;
  name: string;
  email: string;
  currency: string;
  language: string;
}

export interface IUserRegistrationInfo {
  name: string;
  email: string;
  currency: string;
  language: string;
  password: string;
}

export interface IUserUpdateInfo {
  name?: string;
  currency?: string;
  language?: string;
}
