import type { RenewAccessKeySecretResponse } from '@fonoster/projects/dist/client/types'
import { useMutation, useQueryClient } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useRefreshSecret = () => {
  const queryClient = useQueryClient()

  return useMutation(
    async (ref: string) =>
      (await API.patch('/projects', { ref })).data
        .data as RenewAccessKeySecretResponse,
    {
      onSuccess() {
        queryClient.invalidateQueries('projects')
      },
    }
  )
}
