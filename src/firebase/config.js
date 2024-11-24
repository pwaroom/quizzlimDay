import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDHV6PB-XxqHFfQrqXGCcuFbxB_jgXgpVE",
  authDomain: "quizzlim-24.firebaseapp.com",
  projectId: "quizzlim-24",
  storageBucket: "quizzlim-24.appspot.com",
  messagingSenderId: "115954224527",
  appId: "1:115954224527:web:3b8b8b0b0b0b0b0b0b0b0b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);