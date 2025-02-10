import * as React from 'react'
import { NextAppProvider } from '@toolpad/core/nextjs'
import { PageContainer } from '@toolpad/core/PageContainer'
import { DashboardLayout } from '@toolpad/core/DashboardLayout'
import Head from 'next/head'
import { fnLight, fnDark } from '../../../theme/theme'
import { NAVIGATION } from './navigation'
import type { Session } from '@toolpad/core/AppProvider'

interface LayoutProps {
  children: React.ReactNode
  session: Session | null
  authentication: {
    signIn: () => void
    signOut: () => void
  }
}

export default function Layout({
  children,
  session,
  authentication
}: LayoutProps) {
  const BRANDING = {
    title: 'Fonoster'
  }

  return (
    <NextAppProvider
      navigation={NAVIGATION}
      branding={BRANDING}
      session={session}
      authentication={authentication}
      theme={{
        light: fnLight,
        dark: fnDark
      }}
    >
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
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
