import type {
  CreateAgentRequest,
  CreateAgentResponse,
} from '@fonoster/agents/dist/client/types'
import { useMutation, useQueryClient } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useEditAgent = () => {
  const queryClient = useQueryClient()

  return useMutation(
    async (agent: CreateAgentRequest) =>
      (await API.put('/agents', agent)).data.data as CreateAgentResponse,
    {
      onSuccess() {
        queryClient.invalidateQueries('agents')
      },
    }
  )
}
