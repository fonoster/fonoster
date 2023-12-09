import { useCallback } from 'react'
import create from 'zustand'
import shallow from 'zustand/shallow'

type Store = {
  title: string
  layout: string
  showGaps: boolean
  isFullScreen: boolean
  setTitle: (title: string) => void
  setFullScreen: () => void
  setLayout: (layout: string) => void
  removeGaps: () => void
  reset: () => void
}

const useStore = create<Store>(set => ({
  title: 'Console',
  layout: 'default',
  showGaps: true,
  isFullScreen: false,
  removeGaps: () => set(() => ({ showGaps: false })),
  setFullScreen: () => set(() => ({ isFullScreen: true })),
  setLayout: layout => set(() => ({ layout })),
  setTitle: title =>
    set(() => ({
      title,
      layout: 'default',
      showGaps: true,
      isFullScreen: false,
    })),
  reset: () => set(() => ({ title: 'Console' })),
}))

export const useTitle = () =>
  useStore(
    useCallback(s => s, []),
    shallow
  )
