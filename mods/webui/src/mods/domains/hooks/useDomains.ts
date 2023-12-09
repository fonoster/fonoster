import type { Domain } from '@fonoster/domains/dist/client/types'
import { useQuery } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useDomains = (queryKey = 'domains') => {
  const { data, isLoading, isSuccess } = useQuery<{
    nextPageToken: string
    domains: Domain[]
  }>([queryKey], async () => (await API.get('/domains')).data.data)

  return {
    domains: data?.domains ?? [],
    isLoading,
    isSuccess,
  }
}
