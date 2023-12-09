import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { PAGES } from '@/mods/shared/constants/pages'
import { Spinner } from '@/ui/Spinner'

import { useLoggedIn } from '../hooks/useLoggedIn'
import { usePageView } from '../hooks/usePageView'

export const Unauthenticated: NextPage = ({ children }) => {
  const { push } = useRouter()
  const { isLoading, isUnauthenticated } = useLoggedIn()

  useEffect(() => {
    if (isLoading) return

    if (!isUnauthenticated) push(PAGES.HOME)
  }, [isLoading, isUnauthenticated, push])

  usePageView()

  return isUnauthenticated ? <>{children}</> : <Spinner />
}
