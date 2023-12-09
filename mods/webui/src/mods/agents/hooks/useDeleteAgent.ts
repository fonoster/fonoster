import type { DeleteAgentResponse } from '@fonoster/agents/dist/client/types'
import { useMutation, useQueryClient } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useDeleteAgent = () => {
  const queryClient = useQueryClient()

  return useMutation(
    async (ref: string) =>
      (await API.delete('/agents', { data: { ref } })).data
        .data as DeleteAgentResponse,
    {
      onSuccess() {
        queryClient.invalidateQueries('agents')
      },
    }
  )
}
