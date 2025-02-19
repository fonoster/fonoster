import React from 'react'
import { useRouter } from 'next/router'
import { AppCacheProvider } from '@mui/material-nextjs/v15-pagesRouter';
import LayoutProvider from '@/common/components/layout/noAuth/LayoutProvider'
import { LayoutWrapper } from '@/common/components/layout/auth/LayoutWrapper'
import { FonosterProvider } from '@/common/sdk/provider/FonosterContext'

export default function App({ Component }: { Component: React.ElementType }) {
  const router = useRouter()

  const isPageNotAuthentication =
    router.pathname === '/signin' ||
    router.pathname === '/signup' ||
    router.pathname === '/signup/verify' ||
    router.pathname === '/forgot-password' ||
    router.pathname === '/forgot-password/[token]'

  return (
    <AppCacheProvider>
      <FonosterProvider>
          {isPageNotAuthentication ? (
            <LayoutProvider >
              <Component />
            </LayoutProvider>
          ) : (
            <LayoutWrapper>
              <Component />
            </LayoutWrapper>
          )}
      </FonosterProvider>
    </AppCacheProvider>
  )
}
