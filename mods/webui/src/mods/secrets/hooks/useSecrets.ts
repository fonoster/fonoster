import type { ListSecretsResponse } from '@fonoster/secrets/dist/client/types'
import { useQuery } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useSecrets = (queryKey = 'secrets') => {
  const { data, isLoading, isSuccess } = useQuery<ListSecretsResponse>(
    [queryKey],
    async () => (await API.get('/secrets')).data.data
  )

  return {
    secrets: data?.secrets ?? [],
    isLoading,
    isSuccess,
  }
}
