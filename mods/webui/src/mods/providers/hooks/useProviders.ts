import type { ListProvidersResponse } from '@fonoster/providers/dist/client/types'
import { useQuery } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useProviders = (queryKey = 'providers') => {
  const { data, isLoading, isSuccess } = useQuery<ListProvidersResponse>(
    [queryKey],
    async () => (await API.get('/providers')).data.data
  )

  return {
    providers: data?.providers ?? [],
    isLoading,
    isSuccess,
  }
}
