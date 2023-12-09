import type { Agent } from '@fonoster/agents/dist/client/types'
import { useCallback } from 'react'
import shallow from 'zustand/shallow'

import { Privacy } from '@/@types/Fonoster'

import { createPanelStore } from '../../../shared/hooks/useCreatePanelStore'

const useStore = createPanelStore<Partial<Agent>>({
  name: '',
  username: '',
  secret: '',
  domains: [],
  privacy: Privacy.PRIVATE,
})

export const useCreationEditingAgent = () =>
  useStore(
    useCallback(s => s, []),
    shallow
  )
