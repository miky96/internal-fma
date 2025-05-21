import { User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import React, {
  createContext, useState, useEffect, useMemo, ReactNode,
  useCallback,
  Dispatch,
  SetStateAction,
} from 'react';
import { SignOutUser, userStateListener } from '../firebase/firebase';

interface Props {
  children: ReactNode
}

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: Dispatch<SetStateAction<User | null>>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  // "User" comes from firebase auth-public.d.ts
  currentUser: {} as User | null,
  setCurrentUser: () => { },
  signOut: () => { },
});

export const AuthProvider = ({ children }: Props) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = userStateListener((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
    return unsubscribe;
  }, [setCurrentUser]);

  // As soon as setting the current user to null,
  // the user will be redirected to the home page.
  const signOut = useCallback(() => {
    SignOutUser();
    setCurrentUser(null);
    navigate('/');
  }, [navigate]);

  const value = useMemo(() => ({
    currentUser,
    setCurrentUser,
    signOut,
  }), [currentUser, setCurrentUser, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
