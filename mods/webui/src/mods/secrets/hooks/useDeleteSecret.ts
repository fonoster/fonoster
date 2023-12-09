import { useMutation, useQueryClient } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useDeleteSecret = () => {
  const queryClient = useQueryClient()

  return useMutation(
    async (name: string) =>
      (await API.delete('/secrets', { data: { name } })).data,
    {
      onSuccess() {
        queryClient.invalidateQueries('secrets')
      },
    }
  )
}
