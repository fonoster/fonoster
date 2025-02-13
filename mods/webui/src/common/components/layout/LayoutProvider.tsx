import * as React from 'react'
import { NextAppProvider } from '@toolpad/core/nextjs'
import Head from 'next/head'
import { fnLight, fnDark } from '../../../../theme/theme'
import type { Authentication as ToolpadAuth } from '@toolpad/core/AppProvider'
import { BaseLayoutProps } from '@/types/layout'

export default function AuthLayout({ children, session, authentication }: BaseLayoutProps) {
  const BRANDING = {
    title: 'Fonoster'
  }

  const toolpadAuth: ToolpadAuth = {
    signIn: () => authentication.signIn({ username: '', password: '' }),
    signOut: authentication.signOut
  }

  return (
    <NextAppProvider
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
      </Head>
      {children}
    </NextAppProvider>
  )
}
