import 'dotenv/config';
import mongoose from 'mongoose';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import firebaseApp from './firebase/firebaseApp.js';
console.log('Firebase project id: ' + firebaseApp);

//import { updateUserById } from './api/user.js';
//import { NewUserInput } from './api/types/User/interface.js';
//import { castToNewUserInput } from './api/types/User/user.js';
//import { createUser } from './api/user.js';
//import { IuserRegistrationInfo } from './api/types/User/interface.js';
import { getUserById } from './api/user.js';
//import { NewUserInput } from './api/types/interfaces/User.js';

try {
  await mongoose.connect(process.env.MONGO_URI);
} catch (err) {
  throw new Error('Failed to connect to MongoDB');
}

/*const newUserInput: IuserRegistrationInfo = {
  name: 'Gregor Svržnjak',
  email: 'gregor.svrznjak9@gmail.com',
  currency: 'EUR',
  language: 'sl-SI',
  password: 'newPassword',
};*/

await getUserById('6319700ccac59dc8fdc9de04');
/*
const user: User = await instantiateUserFromUserId('6319700ccac59dc8fdc9de05');
const newBudget = await user.addNewBudget({
  name: 'Test',
  description: 'Test',
  defaultInterestRate: {
    type: 'PERCENTAGE_PER_DURATION',
    duration: 'DAY',
    amount: 5,
    entryTimestamp: 2123145213123,
    revisions: [],
  },
  calculatedTotalAmount: 0,
  calculatedLendedAmount: 0,
});
console.log(newBudget.detach());
//console.log((await createUser(newUserInput)).detach());

/*
const x = castToNewUserInput({
  name: 'Gregor Svržnjak',
  email: 'gregor.svrznjak@gmail.com',
  currency: 'EUR',
  language: 'sl-SI',
} as NewUserInput);

x.validate();

/*const updateInfo: UpdateUserInput = {
  name: 'Gregor Svržnjak',
  currency: 'EUR',
  language: 'sl-SI',
};

console.log(await updateUserById('6315e6dea0db26d008768d5f', updateInfo));
*/
