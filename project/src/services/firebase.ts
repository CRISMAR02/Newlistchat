import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAV_ybSr2VrCBrlCQwrmjSJkWhCB388UoU",
  authDomain: "sistema-productos-7ce43.firebaseapp.com",
  projectId: "sistema-productos-7ce43",
  storageBucket: "sistema-productos-7ce43.firebasestorage.app",
  messagingSenderId: "140287576045",
  appId: "1:140287576045:web:7cc302052f7abe895749e4"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Cloud Firestore y obtener referencia al servicio
export const db = getFirestore(app);

// Inicializar Firebase Authentication y obtener referencia al servicio
export const auth = getAuth(app);