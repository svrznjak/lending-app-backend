import mongoose from 'mongoose';
import { IUser } from '../../types/user/userInterface.js';

import UserSchema from '../schema/UserSchema.js';

export interface IUserDocument extends mongoose.Document, Omit<IUser, '_id'> {}

interface UserModel extends mongoose.Model<IUser> {
  existsOneWithId: (id: string) => Promise<boolean>;
}

export default mongoose.model<IUser, UserModel>('Users', UserSchema);
