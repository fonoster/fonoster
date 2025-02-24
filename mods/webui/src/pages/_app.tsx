import React from 'react'
import { useRouter } from 'next/router'
import { AppCacheProvider } from '@mui/material-nextjs/v15-pagesRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import type { AppProps } from 'next/app';
import LayoutProvider from '@/common/components/layout/noAuth/LayoutProvider'
import { LayoutWrapper } from '@/common/components/layout/auth/LayoutWrapper'
import { FonosterProvider } from '@/common/sdk/provider/FonosterContext'
import { fnLight } from '@theme/theme';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  const isPageNotAuthentication =
    router.pathname === '/signin' ||
    router.pathname === '/signup' ||
    router.pathname === '/signup/verify' ||
    router.pathname === '/forgot-password' ||
    router.pathname === '/forgot-password/[token]'

  return (
    <AppCacheProvider>
      <ThemeProvider theme={fnLight}>
        <CssBaseline enableColorScheme />
        <FonosterProvider>
          {isPageNotAuthentication ? (
            <LayoutProvider>
              <Component {...pageProps} />
            </LayoutProvider>
          ) : (
            <LayoutWrapper>
              <Component {...pageProps} />
            </LayoutWrapper>
          )}
        </FonosterProvider>
      </ThemeProvider>
    </AppCacheProvider>
  )
}
