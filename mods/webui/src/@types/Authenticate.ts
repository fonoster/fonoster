import type { NextPage } from 'next'

export type AuthProps = {
  isProtected?: boolean
}

export type AppPage = NextPage & AuthProps
