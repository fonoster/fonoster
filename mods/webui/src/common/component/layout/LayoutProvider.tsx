import * as React from 'react'
import { NextAppProvider } from '@toolpad/core/nextjs'
import Head from 'next/head'
import { fnLight, fnDark } from '../../../../theme/theme'
import type { Session } from '@toolpad/core/AppProvider'

interface AuthLayoutProps {
  children: React.ReactNode
  session: Session | null
  authentication: {
    signIn: () => void
    signOut: () => void
  }
}

export default function AuthLayout({
  children,
  session,
  authentication
}: AuthLayoutProps) {
  const BRANDING = {
    title: 'Fonoster'
  }

  return (
    <NextAppProvider
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
      {children}
    </NextAppProvider>
  )
}
