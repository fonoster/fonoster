import React from 'react'
import { useRouter } from 'next/router'
import { AppCacheProvider } from '@mui/material-nextjs/v15-pagesRouter';
import LayoutProvider from '@/common/components/layout/LayoutProvider'
import { LayoutWrapper } from '@/pages/workspace/_components/layouts/LayoutWrapper'
import { FonosterProvider } from '@/common/sdk/provider/FonosterContext'
import FormContextProvider from '@/common/hooksForm/FormContextProvider'

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
        <FormContextProvider>
          {isPageNotAuthentication ? (
            <LayoutProvider >
              <Component />
            </LayoutProvider>
          ) : (
            <LayoutWrapper>
              <Component />
            </LayoutWrapper>
          )}
        </FormContextProvider>
      </FonosterProvider>
    </AppCacheProvider>
  )
}
