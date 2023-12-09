import type { AppProps as NextAppProps } from 'next/app'
import { Session } from 'next-auth'

import type { AuthProps } from '.'

export interface AppProps extends Omit<NextAppProps, 'Component'> {
  Component: NextAppProps['Component'] & AuthProps
  pageProps: NextAppProps['pageProps'] & {
    session: Session
    dehydratedState: unknown
  }
}

export type Nullable<T> = T | null

export type Handler = () => Promise<unknown>

export type IRequestHandler = Record<string, Handler>
