import React from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { fnLight } from '../../theme/theme'

interface StoriesProviderProps {
  children: React.ReactNode
}

export const StoriesProvider = ({ children }: StoriesProviderProps) => {
  return (
    <ThemeProvider theme={fnLight}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
} 