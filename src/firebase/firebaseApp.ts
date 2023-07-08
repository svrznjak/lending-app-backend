import { initializeApp } from 'firebase-admin/app';
import admin from 'firebase-admin';

import config from './firebaseConfig.js';

export default initializeApp({
  credential: admin.credential.cert(config as any),
});
