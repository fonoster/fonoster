import { createContext, useContext } from 'react';
import { WebClient } from '@fonoster/sdk';

interface FonosterContextType {
  client: WebClient | null;
  isInitialized: boolean;
  authentication: {
    signIn: (credentials: { username: string; password: string }) => Promise<void>;
    signOut: () => Promise<void>;
  }
}

export const FonosterContext = createContext<FonosterContextType>({
  client: null,
  isInitialized: false,
  authentication: {
    signIn: async () => {},
    signOut: async () => {}
  }
});

export const useFonoster = () => useContext(FonosterContext); 