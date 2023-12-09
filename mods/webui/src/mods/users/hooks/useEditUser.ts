import type {
  UpdateUserRequest,
  UpdateUserResponse,
} from '@fonoster/users/dist/client/types'
import { useMutation, useQueryClient } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useEditUser = () => {
  const queryClient = useQueryClient()

  return useMutation(
    async (user: UpdateUserRequest) =>
      (await API.put('/users', user)).data.data as UpdateUserResponse,
    {
      onSuccess() {
        queryClient.invalidateQueries('users')
      },
    }
  )
}
