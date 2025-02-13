import * as React from 'react'
import { useState, useMemo, createContext, useContext } from 'react'
import { useRouter } from 'next/router'
import { AppCacheProvider } from '@mui/material-nextjs/v15-pagesRouter';
import { WebClient } from '@fonoster/sdk'
import LayoutProvider from '@/common/components/layout/LayoutProvider'
import MainLayout from '@/pages/workspace/layout'
import { CustomSession } from '@/types/session'
import { FonosterContext } from '@/common/contexts/FonosterContext'

export const useFonoster = () => useContext(FonosterContext);

export default function App({ Component }: { Component: React.ElementType }) {
  const router = useRouter()
  const [session, setSession] = useState<CustomSession>({ isAuthenticated: false });
  const [fonosterClient, setFonosterClient] = useState<WebClient | null>(null)
  const [isClientInitialized, setIsClientInitialized] = useState(false)

  React.useEffect(() => {
    const initializeFonosterClient = async () => {
      try {
        const config: { accessKeyId: string; url?: string } = {
          accessKeyId: process.env.NEXT_PUBLIC_FONOSTER_ACCESS_KEY_ID!
        }

        if (process.env.NEXT_PUBLIC_FONOSTER_URL) {
          config.url = process.env.NEXT_PUBLIC_FONOSTER_URL
        }

        const client = new WebClient(config)
        setFonosterClient(client)
      } catch (error) {
        console.error('Error inicializando el cliente Fonoster:', error)
      } finally {
        setIsClientInitialized(true)
      }
    }

    if (!isClientInitialized) {
      initializeFonosterClient()
    }
  }, [isClientInitialized])

  const fonosterValue = useMemo(
    () => ({
      client: fonosterClient,
      isInitialized: isClientInitialized,
      authentication: {
        signIn: async (credentials: { username: string; password: string }) => {
          if (!fonosterClient) throw new Error('Cliente no inicializado');
          await fonosterClient.login(credentials.username, credentials.password);
          setSession({
            isAuthenticated: true,
            userIdToken: fonosterClient.getIdToken(),
            accessToken: fonosterClient.getAccessToken(),
            refreshToken: fonosterClient.getRefreshToken()
          });
          router.push('/workspace/list');
        },
        signOut: async () => {
          if (fonosterClient) {
            await fonosterClient.logout();
          }
          setSession({ isAuthenticated: false });
          router.push('/signin');
        }
      }
    }),
    [fonosterClient, isClientInitialized, router]
  );

  const isAuthPage =
    router.pathname === '/signin' ||
    router.pathname === '/signup' ||
    router.pathname === '/signup/verify' ||
    router.pathname === '/forgot-password' ||
    router.pathname === '/forgot-password/[token]' ||
    router.pathname === '/workspace/create' ||
    router.pathname === '/workspace/list' 

  return (
    <AppCacheProvider>
      <FonosterContext.Provider value={fonosterValue}>
        {isAuthPage ? (
          <LayoutProvider session={session} authentication={fonosterValue.authentication}>
            <Component />
          </LayoutProvider>
        ) : (
          <MainLayout session={session} authentication={fonosterValue.authentication}>
            <Component />
          </MainLayout>
        )}
      </FonosterContext.Provider>
    </AppCacheProvider>
  )
}
