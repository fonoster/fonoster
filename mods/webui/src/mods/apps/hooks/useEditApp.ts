import type {
  CreateAppRequest,
  CreateAppResponse,
} from '@fonoster/apps/dist/client/types'
import { useMutation, useQueryClient } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useEditApp = () => {
  const queryClient = useQueryClient()

  return useMutation(
    async (app: CreateAppRequest) =>
      (await API.put('/apps', app)).data.data as CreateAppResponse,
    {
      onSuccess() {
        queryClient.invalidateQueries('apps')
      },
    }
  )
}
