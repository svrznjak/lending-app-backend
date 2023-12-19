export interface IUser {
  _id: string;
  name: string;
  email: string;
  authId: string;
  currency: string;
  language: string; // this is used for displaying text in the client
  formattingLocale: string; // this is used for formating numbers and dates in the client
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
  formattingLocale: string;
}

export interface IUserUpdateInfo {
  name?: string;
  currency?: string;
  language?: string;
  formattingLocale?: string;
}
