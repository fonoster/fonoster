import type { SearchEventsResponse } from '@fonoster/monitor/dist/client/types'
import { useQuery } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useLogs = (
  params: { time: string; eventType?: string; level?: string },
  onSuccess?: (data: SearchEventsResponse) => void,
  refetchInterval = 0,
  onError?: (err: unknown) => void,
  queryKey = 'logs'
) => {
  const { data, isLoading, isSuccess, isRefetching, isFetching } =
    useQuery<SearchEventsResponse>(
      [queryKey, params],
      async () =>
        (
          await API.get('/monitor', {
            params,
          })
        ).data.data,
      {
        refetchInterval,
        onSuccess,
        onError,
      }
    )

  return {
    events: data?.events ?? [],
    isLoading,
    isSuccess,
    isRefetching,
    isFetching,
  }
}
