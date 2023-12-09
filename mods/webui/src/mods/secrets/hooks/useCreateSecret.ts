import type {
  CreateSecretRequest,
  CreateSecretResponse,
} from '@fonoster/secrets/dist/client/types'
import { useMutation, useQueryClient } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useCreateSecret = () => {
  const queryClient = useQueryClient()

  return useMutation(
    async (secret: CreateSecretRequest) =>
      (await API.post('/secrets', secret)).data.data as CreateSecretResponse,
    {
      onSuccess() {
        queryClient.invalidateQueries('secrets')
      },
    }
  )
}
