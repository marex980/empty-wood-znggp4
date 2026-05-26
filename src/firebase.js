import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Tvoji ključevi sa Firebase konzole:
const firebaseConfig = {
  apiKey: "AIzaSyDeGBxwN1pgldTHhxyca9Lf1IVYM7nA7r0",
  authDomain: "hana-skola-solfedjo.firebaseapp.com",
  projectId: "hana-skola-solfedjo",
  storageBucket: "hana-skola-solfedjo.firebasestorage.app",
  messagingSenderId: "368134461390",
  appId: "1:368134461390:web:fe288c4a3849cf13d73d9f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
