import { useCallback, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import * as SDK from '@fonoster/sdk';
import { FonosterContext } from '@/common/sdk/provider/FonosterContext';
import { tokenUtils } from '@/common/utils/tokenUtils';

interface FonosterClient {
  client: SDK.WebClient | null;
  isReady: boolean;
  authentication: {
    signIn: (credentials: { username: string; password: string }) => Promise<void>;
    signOut: () => Promise<void>;
  };
  SDK: typeof SDK;
}

export function useFonosterClient(): FonosterClient {
  const context = useContext(FonosterContext);
  const router = useRouter();

  if (!context) {
    throw new Error('useFonosterClient debe ser utilizado dentro de un FonosterContext.Provider');
  }

  return {
    client: context.client,
    isReady: context.isInitialized && context.client !== null,
    authentication: context.authentication,
    SDK
  };
}
