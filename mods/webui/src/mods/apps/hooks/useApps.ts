import type { ListAppsResponse } from '@fonoster/apps/dist/client/types'
import { useQuery } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useApps = (queryKey = 'apps') => {
  const { data, isLoading, isSuccess } = useQuery<ListAppsResponse>(
    [queryKey],
    async () => (await API.get('/apps')).data.data
  )

  return {
    apps: data?.apps ?? [],
    isLoading,
    isSuccess,
  }
}
