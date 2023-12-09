import type { GetUserResponse } from '@fonoster/users/dist/client/types'
import { useQuery } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useGetUserLogged = (
  params: {
    ref: string
    enabled?: boolean
  },
  queryKey = 'users'
) => {
  const { data, isLoading, isSuccess } = useQuery(
    [queryKey, params.ref],
    async () =>
      (
        await API.get('/users', {
          params: {
            ref: params.ref,
          },
        })
      ).data.data as GetUserResponse,
    {
      enabled: params.enabled,
    }
  )

  return {
    user: data,
    isLoading,
    isSuccess,
  }
}
