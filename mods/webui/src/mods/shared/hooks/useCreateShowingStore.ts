import create from 'zustand'

type Store = {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const createShowingStore = () =>
  create<Store>(set => ({
    isOpen: false,
    open: () => set(() => ({ isOpen: true })),
    close: () => set(() => ({ isOpen: false })),
  }))
