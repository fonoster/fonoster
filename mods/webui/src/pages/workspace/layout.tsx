import * as React from 'react'
import { NextAppProvider } from '@toolpad/core/nextjs'
import { PageContainer } from '@toolpad/core/PageContainer'
import { DashboardLayout } from '@toolpad/core/DashboardLayout'
import Head from 'next/head'
import { fnLight, fnDark } from '../../../theme/theme'
import { NAVIGATION } from './navigation'

export default function Layout({ children}: { children: React.ReactNode }) {
  const BRANDING = {
    title: 'Fonoster'
  }

  return (
    <NextAppProvider
      navigation={NAVIGATION}
      branding={BRANDING}
      theme={{
        light: fnLight,
        dark: fnDark
      }}
    >
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <meta charSet="utf-8" />
        <meta name="description" content="Fonoster Workspace" />
        <title>{BRANDING.title}</title>
      </Head>
      <DashboardLayout>
        <PageContainer
          maxWidth={false}
          disableGutters
          sx={{
            width: '85%',
            '& .MuiContainer-root': {
              maxWidth: 'none',
              padding: 0,
              margin: 0
            }
          }}
        >
          {children}
        </PageContainer>
      </DashboardLayout>
    </NextAppProvider>
  )
}
