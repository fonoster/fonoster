import '../styles/styles.css'

import { SessionProvider } from 'next-auth/react'
import { NextQueryParamProvider } from 'next-query-params'
import React, { useEffect } from 'react'
import { Hydrate, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { injectStyle } from 'react-toastify/dist/inject-style'

import type { AppProps } from '@/@types'
import { Authenticated } from '@/mods/auth/components/Authenticated'
import { Unauthenticated } from '@/mods/auth/components/Unauthenticated'
import { Layout } from '@/mods/shared/components/layouts'
import { Progress } from '@/mods/shared/components/Progress'
import { getQueryClient } from '@/mods/shared/libs/queryClient'
import { Meta } from '@/ui'

const Application = ({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) => {
  const { current: queryClient } = React.useRef(getQueryClient())

  useEffect(() => {
    injectStyle()
  }, [])

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <Hydrate state={pageProps?.dehydratedState}>
          <NextQueryParamProvider>
            <Meta />
            <Progress />

            <ReactQueryDevtools initialIsOpen={false} />

            {Component?.isProtected ? (
              <Authenticated>
                <Layout>
                  <Component {...pageProps} />
                </Layout>
              </Authenticated>
            ) : (
              <Unauthenticated>
                <Component {...pageProps} />
              </Unauthenticated>
            )}
          </NextQueryParamProvider>
        </Hydrate>
      </QueryClientProvider>
    </SessionProvider>
  )
}

export default Application
