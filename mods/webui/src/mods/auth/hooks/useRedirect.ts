import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'

import { PAGES } from '@/mods/shared/constants/pages'
import { Storage } from '@/mods/shared/helpers/Storage'

export const REDIRECT_TO_KEY = 'fonoster.redirectTo'

export const redirectStore = new Storage(REDIRECT_TO_KEY)

export const useRedirect = () => {
  const {
    asPath,
    replace,
    push,
    query: { redirect_to: redirectParam },
  } = useRouter()
  const [hasRedirectToChecked, setHasRedirectToChecked] = useState(false)

  const redirectToSignIn = useCallback(() => replace(PAGES.SIGN_IN), [replace])

  const redirectToNextPage = useCallback(() => {
    const nextPath = redirectParam ?? redirectStore.get()

    if (nextPath) {
      if (!nextPath.includes(asPath)) push(nextPath as string)

      redirectStore.destroy()
    }
  }, [asPath, push, redirectParam])

  useEffect(() => {
    if (redirectParam && typeof redirectParam === 'string')
      redirectStore.set(redirectParam)
  }, [redirectParam])

  return {
    hasRedirectToChecked,
    setHasRedirectToChecked,
    redirectToSignIn,
    redirectToNextPage,
  }
}
