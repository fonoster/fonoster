import type { DeleteProviderResponse } from '@fonoster/providers/dist/client/types'
import { useMutation, useQueryClient } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useDeleteProject = () => {
  const queryClient = useQueryClient()

  return useMutation(
    async (ref: string) =>
      (await API.delete('/projects', { data: { ref } })).data
        .data as DeleteProviderResponse,
    {
      onSuccess() {
        queryClient.invalidateQueries('projects')
      },
    }
  )
}
