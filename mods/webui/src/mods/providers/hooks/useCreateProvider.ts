import type {
  CreateProviderRequest,
  CreateProviderResponse,
} from '@fonoster/providers/dist/client/types'
import { useMutation, useQueryClient } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useCreateProvider = () => {
  const queryClient = useQueryClient()

  return useMutation(
    async (provider: CreateProviderRequest) =>
      (await API.post('/providers', provider)).data
        .data as CreateProviderResponse,
    {
      onSuccess() {
        queryClient.invalidateQueries('providers')
      },
    }
  )
}
