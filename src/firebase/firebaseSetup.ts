import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Configuracio del projecte llegida d'env vars (Vite injecta tot allo que
// comenci amb VITE_). La apiKey de Firebase Web es publica per disseny;
// la seguretat es controla via regles de Firestore i auth domains.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Inicialitzem app i auth al carregar el modul perque calen ja a Home (login).
// Firestore es difereix a firestore.ts perque nomes l'usen rutes lazy.
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export function getFirebaseConfig() {
  if (!firebaseConfig || !firebaseConfig.apiKey) {
    throw new Error('No Firebase configuration object provided.');
  }
  return firebaseConfig;
}
