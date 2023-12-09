import type { DeleteProviderResponse } from '@fonoster/providers/dist/client/types'
import { useMutation, useQueryClient } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useDeleteProvider = () => {
  const queryClient = useQueryClient()

  return useMutation(
    async (ref: string) =>
      (await API.delete('/providers', { data: { ref } })).data
        .data as DeleteProviderResponse,
    {
      onSuccess() {
        queryClient.invalidateQueries('providers')
      },
    }
  )
}
