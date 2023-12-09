import type { Domain } from '@fonoster/domains/dist/client/types'
import { useCallback } from 'react'
import shallow from 'zustand/shallow'

import { createPanelStore } from '../../../shared/hooks/useCreatePanelStore'

const useStore = createPanelStore<Partial<Domain>>({
  name: '',
  domainUri: '',
  egressRule: '',
  egressNumberRef: '',
})

export const useCreationEditingDomain = () =>
  useStore(
    useCallback(s => s, []),
    shallow
  )
