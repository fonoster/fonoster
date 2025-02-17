import React from 'react'
import { useRouter } from 'next/router'
import { AppCacheProvider } from '@mui/material-nextjs/v15-pagesRouter';
import LayoutProvider from '@/common/components/layout/LayoutProvider'
import MainLayout from '@/pages/workspace/layout'
import { FonosterProvider } from '@/common/sdk/provider/FonosterContext'
import FormContextProvider from '@/common/hooksForm/FormContextProvider'

export default function App({ Component }: { Component: React.ElementType }) {
  const router = useRouter()

  const isAuthPage =
    router.pathname === '/signin' ||
    router.pathname === '/signup' ||
    router.pathname === '/signup/verify' ||
    router.pathname === '/forgot-password' ||
    router.pathname === '/forgot-password/[token]' ||
    router.pathname === '/workspace/create' ||
    router.pathname === '/workspace/list';

  return (
    <AppCacheProvider>
      <FonosterProvider>
        <FormContextProvider>
        {isAuthPage ? (
          <LayoutProvider >
            <Component />
          </LayoutProvider>
        ) : (
          <MainLayout>
            <Component />
          </MainLayout>
        )}
          </FormContextProvider>
      </FonosterProvider>
    </AppCacheProvider>
  )
}
