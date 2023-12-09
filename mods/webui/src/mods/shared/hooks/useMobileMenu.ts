import { useCallback } from 'react'
import shallow from 'zustand/shallow'

import { createShowingStore } from './useCreateShowingStore'

const useStore = createShowingStore()

export const useMobileMenu = () =>
  useStore(
    useCallback(s => s, []),
    shallow
  )
