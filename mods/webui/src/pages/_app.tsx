import React from 'react'
import { useRouter } from 'next/router'
import { AppCacheProvider } from '@mui/material-nextjs/v15-pagesRouter';
import { NoAuthLayout } from '@/common/components/layout/noAuth/NoAuthLayout'
import { LayoutWrapper as LayoutAuth } from '@/common/components/layout/auth/LayoutWrapper'
import { FonosterProvider } from '@/common/sdk/provider/FonosterContext'
import { WorkspaceProvider } from '@/common/sdk/provider/WorkspaceContext'

export default function App({ Component, pageProps }: { Component: React.ElementType, pageProps: any }) {
  const router = useRouter()

  const isPageNotAuthentication =
    router.pathname === '/signin' ||
    router.pathname === '/signup' ||
    router.pathname === '/signup/verify' ||
    router.pathname === '/forgot-password' ||
    router.pathname === '/forgot-password/[token]' ||
    router.pathname === '/404'

  return (
    <AppCacheProvider>
      <FonosterProvider>
        {isPageNotAuthentication ? (
          <NoAuthLayout>
            <Component {...pageProps} />
          </NoAuthLayout>
        ) : (
          <WorkspaceProvider>
            <LayoutAuth>
              <Component {...pageProps} />
            </LayoutAuth>
          </WorkspaceProvider>
        )}
      </FonosterProvider>
    </AppCacheProvider>
  )
}
