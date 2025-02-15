import * as React from 'react'
import { NextAppProvider } from '@toolpad/core/nextjs'
import Head from 'next/head'
import { fnLight, fnDark } from '../../../../theme/theme'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const BRANDING = {
    title: 'Fonoster'
  }
  return (
    <NextAppProvider
      branding={BRANDING}
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
