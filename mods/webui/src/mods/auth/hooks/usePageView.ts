import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { useLoggedIn } from './useLoggedIn'

export const usePageView = () => {
  const router = useRouter()
  const { user } = useLoggedIn()

  useEffect(() => {
    const handleRouteChange = (url: string) => {}

    router.events.on('routeChangeComplete', handleRouteChange)

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events, user?.accessKeyId])
}
