import { signOut } from 'next-auth/react'
import { DefaultOptions, QueryClient } from 'react-query'

import { userStore } from '@/mods/auth/hooks/useLoggedIn'
import { currentProjectStorage } from '@/mods/projects/components/current-project'

const onError = (err: any) => {
  console.error(err)
  const data = err['response']['data']

  const isAuthError = Boolean(data && data['status'] === 401)

  if (isAuthError) {
    userStore.destroy()
    currentProjectStorage.destroy()
    signOut()
  }
}

/**
 * React Query Options
 * @summary Set the config on all queries and mutations through the client.
 *
 * @author Fonoster
 */
const defaultOptions: DefaultOptions = {
  queries: {
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    notifyOnChangeProps: ['data', 'error'],
    onError,
  },
  mutations: { onError },
}

export const getQueryClient = () => new QueryClient({ defaultOptions })
