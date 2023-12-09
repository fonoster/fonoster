import type {
  UpdateProjectRequest,
  UpdateProjectResponse,
} from '@fonoster/projects/dist/client/types'
import { useMutation, useQueryClient } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useEditProject = () => {
  const queryClient = useQueryClient()

  return useMutation(
    async (project: UpdateProjectRequest) =>
      (await API.put('/projects', project)).data.data as UpdateProjectResponse,
    {
      onSuccess() {
        queryClient.invalidateQueries('projects')
      },
    }
  )
}
