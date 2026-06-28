import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD_ipXGGLOvEaYHGi6gnHNqjf2fCAP7kIM",
  authDomain: "gen-lang-client-0909252278.firebaseapp.com",
  projectId: "gen-lang-client-0909252278",
  storageBucket: "gen-lang-client-0909252278.firebasestorage.app",
  messagingSenderId: "950041528757",
  appId: "1:950041528757:web:624906a45809e8763d31fc"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with the specific database ID from config
export const db = initializeFirestore(app, {}, "ai-studio-5e890d72-f53c-4e0e-a4a8-dd917898ca86");
