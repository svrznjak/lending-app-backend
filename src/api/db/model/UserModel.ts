import mongoose from 'mongoose';

import UserSchema from '../schema/UserSchema.js';

export default mongoose.model('Users', UserSchema);
