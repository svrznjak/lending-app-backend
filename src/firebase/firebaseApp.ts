import admin from 'firebase-admin';

import config from './firebaseConfig.js';

export default admin.initializeApp({
  credential: admin.credential.cert(config as any),
});
