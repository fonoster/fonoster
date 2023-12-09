import type { CreateNumberRequest } from '@fonoster/numbers/dist/client/types'
import { useCallback } from 'react'
import shallow from 'zustand/shallow'

import { createPanelStore } from '../../../shared/hooks/useCreatePanelStore'

const useStore = createPanelStore<Partial<CreateNumberRequest>>({
  providerRef: '',
  e164Number: '',
  ingressInfo: {
    webhook: '',
    appRef: '',
  },
})

export const useCreationEditingNumber = () =>
  useStore(
    useCallback(s => s, []),
    shallow
  )
