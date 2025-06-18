import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  NextOrObserver,
  User,
} from 'firebase/auth';
// eslint-disable-next-line import/extensions
import { getFirebaseConfig } from './firebaseSetup';

const app = initializeApp(getFirebaseConfig());
const auth = getAuth(app);

export const signInUser = async (
  email: string,
  password: string,
) => {
  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential; // Successfully signed in
  } catch (error: unknown) {
    let errorMessage = '';

    // Type assertion to make sure error is FirebaseError
    if (error instanceof Error) {
      switch ((error as any).code) {
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
    } else {
      errorMessage = 'An unknown error occurred.';
    }

    return { error: errorMessage };
  }
};

export const userStateListener = (callback: NextOrObserver<User>) => onAuthStateChanged(auth, callback);

export const SignOutUser = async () => signOut(auth);
