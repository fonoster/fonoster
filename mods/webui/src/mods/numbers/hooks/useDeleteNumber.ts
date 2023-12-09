import type { DeleteNumberResponse } from '@fonoster/numbers/dist/client/types'
import { useMutation, useQueryClient } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useDeleteNumber = () => {
  const queryClient = useQueryClient()

  return useMutation(
    async (ref: string) =>
      (await API.delete('/numbers', { data: { ref } })).data
        .data as DeleteNumberResponse,
    {
      onSuccess() {
        queryClient.invalidateQueries('numbers')
      },
    }
  )
}
