import type { DeleteAppResponse } from '@fonoster/apps/dist/client/types'
import { useMutation, useQueryClient } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useDeleteApp = () => {
  const queryClient = useQueryClient()

  return useMutation(
    async (ref: string) =>
      (await API.delete('/apps', { data: { ref } })).data
        .data as DeleteAppResponse,
    {
      onSuccess() {
        queryClient.invalidateQueries('apps')
      },
    }
  )
}
