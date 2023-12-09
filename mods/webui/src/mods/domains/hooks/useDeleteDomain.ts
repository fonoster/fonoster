import type { DeleteDomainResponse } from '@fonoster/domains/dist/client/types'
import { useMutation, useQueryClient } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useDeleteDomain = () => {
  const queryClient = useQueryClient()

  return useMutation(
    async (ref: string) =>
      (await API.delete('/domains', { data: { ref } })).data
        .data as DeleteDomainResponse,
    {
      onSuccess() {
        queryClient.invalidateQueries('domains')
      },
    }
  )
}
