import type { Project } from '@fonoster/projects/dist/client/types'
import { StringParam, useQueryParam } from 'next-query-params'
import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from 'react-query'

import { useLoggedIn } from '@/mods/auth/hooks/useLoggedIn'
import { Storage } from '@/mods/shared/helpers/Storage'

import { useProjects } from '../../hooks/useProjects'

export const currentProjectStorage = new Storage('fonoster.current_project')

export const getCurrentProjectFromStorage = () => {
  const project = currentProjectStorage.get()

  return project ? (JSON.parse(project) as Project) : null
}

export const useCurrentProject = () => {
  const { user } = useLoggedIn()
  const queryClient = useQueryClient()
  const { projects, hasProjects, isSuccess } = useProjects()

  const [projectRef, setProjectRef] = useQueryParam('project', StringParam)

  const [currentProject, setCurrentProject] = useState<Project | null>(null)

  const changeCurrentProject = useCallback(
    (project: Project | null) => {
      setProjectRef(project?.ref)
      setCurrentProject(prevProject => {
        project
          ? currentProjectStorage.set(JSON.stringify(project))
          : currentProjectStorage.destroy()

        if (prevProject?.ref !== project?.ref) queryClient.invalidateQueries()

        return project
      })
    },
    [setProjectRef, queryClient]
  )

  const getProject = useCallback(() => {
    const projectFromStorage = getCurrentProjectFromStorage()
    const project = projects.find(
      p => p.ref === (projectRef ?? projectFromStorage?.ref)
    )

    return project ?? projects[0]
  }, [projectRef, projects])

  const setDefaultProject = useCallback(() => {
    if (hasProjects && isSuccess) {
      const project = getProject()

      changeCurrentProject(
        user?.accessKeyId === project.userRef ? project : null
      )
    }
  }, [
    hasProjects,
    user.accessKeyId,
    getProject,
    isSuccess,
    changeCurrentProject,
  ])

  useEffect(() => {
    setDefaultProject()
  }, [setDefaultProject])

  return {
    isSuccess,
    projects,
    hasProjects,
    changeCurrentProject,
    currentProject,
    setDefaultProject,
    projectRef,
    setProjectRef,
  }
}
