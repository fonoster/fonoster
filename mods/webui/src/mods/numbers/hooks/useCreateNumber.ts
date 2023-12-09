import type {
  CreateNumberRequest,
  CreateNumberResponse,
} from '@fonoster/numbers/dist/client/types'
import { useMutation, useQueryClient } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useCreateNumber = () => {
  const queryClient = useQueryClient()

  return useMutation(
    async (number: CreateNumberRequest) =>
      (await API.post('/numbers', number)).data.data as CreateNumberResponse,
    {
      onSuccess() {
        queryClient.invalidateQueries('numbers')
      },
    }
  )
}
