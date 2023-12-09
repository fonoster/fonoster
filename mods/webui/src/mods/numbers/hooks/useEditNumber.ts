import type {
  CreateNumberRequest,
  CreateNumberResponse,
} from '@fonoster/numbers/dist/client/types'
import { useMutation, useQueryClient } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useEditNumber = () => {
  const queryClient = useQueryClient()

  return useMutation(
    async (number: CreateNumberRequest) =>
      (await API.put('/numbers', number)).data.data as CreateNumberResponse,
    {
      onSuccess() {
        queryClient.invalidateQueries('numbers')
      },
    }
  )
}
