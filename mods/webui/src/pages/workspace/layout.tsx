import * as React from 'react'
import { NextAppProvider } from '@toolpad/core/nextjs'
import { PageContainer } from '@toolpad/core/PageContainer'
import { DashboardLayout } from '@toolpad/core/DashboardLayout'
import Head from 'next/head'
import { fnLight, fnDark } from '../../../theme/theme'
import { NAVIGATION } from './navigation'
import type { Authentication as ToolpadAuth } from '@toolpad/core/AppProvider'
import { BaseLayoutProps } from '@/types/layout'

export default function Layout({ children, session, authentication }: BaseLayoutProps) {
  const BRANDING = {
    title: 'Fonoster'
  }

  const toolpadAuth: ToolpadAuth = {
    signIn: () => authentication.signIn({ username: '', password: '' }),
    signOut: authentication.signOut
  }

  return (
    <NextAppProvider
      navigation={NAVIGATION}
      branding={BRANDING}
      session={session}
      authentication={toolpadAuth}
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
