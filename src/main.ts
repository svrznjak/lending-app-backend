import initFirebase from './firebase/firebaseApp.js';

initFirebase();

function hello(text: string): void {
  console.log(text);
}

hello('My hello');
