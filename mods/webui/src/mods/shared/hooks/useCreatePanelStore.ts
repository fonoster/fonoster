import create from 'zustand'

type Store<T> = {
  isOpen: boolean
  isEdit: boolean
  defaultValues: T
  setDefaultValues: (defaultValues: T) => void
  open: () => void
  close: () => void
  openEditing: (defaultValues: T) => void
}

export const createPanelStore = <T>(defaultValues: T) =>
  create<Store<T>>(set => ({
    isOpen: false,
    isEdit: false,
    defaultValues,
    open: () => set(() => ({ isOpen: true, isEdit: false })),
    close: () => set(() => ({ isOpen: false })),
    openEditing: defaultValues =>
      set(() => ({ isOpen: true, isEdit: true, defaultValues })),
    setDefaultValues: defaultValues => ({ defaultValues }),
  }))
