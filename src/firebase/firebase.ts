import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  NextOrObserver,
  User,
} from 'firebase/auth';
import { auth } from './firebaseSetup';

export const signInUser = async (email: string, password: string) => {
  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error: unknown) {
    if (error instanceof Error) {
      const { code } = error as Error & { code?: string };
      switch (code) {
        case 'auth/invalid-email':
          throw new Error('El login ha fallat. Email incorrecte.');
        case 'auth/user-disabled':
          throw new Error('El login ha fallat. Aquesta conta esta deshabilitada.');
        case 'auth/user-not-found':
          throw new Error('El login ha fallat. Usuari inexistent.');
        case 'auth/wrong-password':
          throw new Error('El login ha fallat. Contrassenya incorrecte.');
        default:
          throw new Error('El login ha fallat. Torna a provar.');
      }
    }
    return { error: 'An unknown error occurred.' };
  }
};

export const userStateListener = (callback: NextOrObserver<User>) => onAuthStateChanged(auth, callback);

export const SignOutUser = async () => signOut(auth);
