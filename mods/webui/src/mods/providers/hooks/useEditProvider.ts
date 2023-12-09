import type {
  CreateProviderRequest,
  CreateProviderResponse,
} from '@fonoster/providers/dist/client/types'
import { useMutation, useQueryClient } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useEditProvider = () => {
  const queryClient = useQueryClient()

  return useMutation(
    async (provider: CreateProviderRequest) =>
      (await API.put('/providers', provider)).data
        .data as CreateProviderResponse,
    {
      onSuccess() {
        queryClient.invalidateQueries('providers')
      },
    }
  )
}
