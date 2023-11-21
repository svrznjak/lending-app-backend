import { INote } from '../note/noteInterface.js';

export interface ICustomer {
  _id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: INote[];
  isArchived: boolean;
  entryTimestamp: number;
}
