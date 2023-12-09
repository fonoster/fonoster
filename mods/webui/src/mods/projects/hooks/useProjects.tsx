import type { ListProjectsResponse } from '@fonoster/projects/dist/client/types'
import { useMemo } from 'react'
import { useQuery } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useProjects = (queryKey = 'projects') => {
  const { data, isLoading, isSuccess } = useQuery<ListProjectsResponse>(
    [queryKey],
    async () => (await API.get('/projects')).data.data
  )

  const projects = useMemo(() => data?.projects ?? [], [data])
  const hasProjects = useMemo(() => projects.length !== 0, [projects])

  return {
    projects,
    hasProjects,
    isLoading,
    isSuccess,
  }
}
