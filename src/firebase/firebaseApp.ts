import { initializeApp } from 'firebase/app';

import config from './firebaseConfig.js';

export default function initFirebase(): void {
  initializeApp(config);
}
