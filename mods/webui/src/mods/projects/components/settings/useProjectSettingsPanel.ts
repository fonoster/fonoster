import type { Project } from '@fonoster/projects/dist/client/types'
import { useCallback } from 'react'
import shallow from 'zustand/shallow'

import { createPanelStore } from '@/mods/shared/hooks/useCreatePanelStore'

const useStore = createPanelStore<Partial<Project>>({
  name: '',
  userRef: '',
  accessKeyId: '',
  accessKeySecret: '',
  allowExperiments: '',
})

export const useProjectSettingsPanel = () =>
  useStore(
    useCallback(s => s, []),
    shallow
  )
