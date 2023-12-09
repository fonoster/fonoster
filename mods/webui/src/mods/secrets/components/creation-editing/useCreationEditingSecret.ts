import type { CreateSecretRequest } from '@fonoster/secrets/dist/client/types'
import { useCallback } from 'react'
import shallow from 'zustand/shallow'

import { createPanelStore } from '@/mods/shared/hooks/useCreatePanelStore'

const useStore = createPanelStore<Partial<CreateSecretRequest>>({
  name: '',
  secret: '',
})

export const useCreationEditingSecret = () =>
  useStore(
    useCallback(s => s, []),
    shallow
  )
