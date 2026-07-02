import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyC0JduF0LlzzgM6lB1jYC0n1kFQuhdi9l4',
  authDomain: 'myportfolio-d7acf.firebaseapp.com',
  projectId: 'myportfolio-d7acf',
  storageBucket: 'myportfolio-d7acf.firebasestorage.app',
  messagingSenderId: '494849489265',
  appId: '1:494849489265:web:45b88097cbed1a4ed35ed0',
  measurementId: 'G-NRTXS3S7GL',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
