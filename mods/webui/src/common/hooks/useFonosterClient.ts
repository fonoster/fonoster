import { useFonoster } from '@/common/contexts/FonosterContext'
import { WebClient } from '@fonoster/sdk'

interface FonosterClient {  
  client: WebClient | null;
  isReady: boolean;
  authentication: {
    signIn: (credentials: { username: string; password: string }) => Promise<void>;
    signOut: () => Promise<void>;
  };
  getTokens: () => {
    accessToken: string | null;
    refreshToken: string | null;
  };
}

export function useFonosterClient(): FonosterClient {
  const context = useFonoster()
  if (!context) {
    throw new Error('useFonosterClient debe usarse dentro de FonosterContext.Provider')
  }

  const getTokens = () => {
    if (!context.client) {
      return { accessToken: null, refreshToken: null }
    }

    return {
      accessToken: context.client.getAccessToken(),
      refreshToken: context.client.getRefreshToken()
    }
  }

  return {
    client: context.client,
    isReady: context.isInitialized,
    authentication: context.authentication,
    getTokens
  }
} 