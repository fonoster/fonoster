import type { Provider } from '@fonoster/providers/dist/client/types'
import { useCallback } from 'react'
import shallow from 'zustand/shallow'

import { createPanelStore } from '@/mods/shared/hooks/useCreatePanelStore'

const useStore = createPanelStore<Partial<Provider>>({
  name: '',
  username: '',
  secret: '',
  host: '',
  transport: '',
  register: false,
  expires: 600,
})

export const useCreationEditingProvider = () =>
  useStore(
    useCallback(s => s, []),
    shallow
  )
