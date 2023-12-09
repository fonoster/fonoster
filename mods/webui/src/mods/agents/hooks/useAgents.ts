import type { Agent } from '@fonoster/agents/dist/client/types'
import { useQuery } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useAgents = (queryKey = 'agents') => {
  const { data, isLoading, isSuccess } = useQuery<{
    nextPageToken: string
    agents: Agent[]
  }>([queryKey], async () => (await API.get('/agents')).data.data)

  return {
    agents: data?.agents ?? [],
    isLoading,
    isSuccess,
  }
}
