import React from 'react'
import type { Preview } from '@storybook/react'
import { themes } from '@storybook/theming'
import { withThemeProvider } from './withThemeProvider'

// Verificar que los temas estén definidos correctamente
console.log('preview.tsx - fnLight primary main:', fnLight.palette.primary.main);
console.log('preview.tsx - fnDark primary main:', fnDark.palette.primary.main);

// Asegurarse de que los temas se utilicen sin modificaciones
const lightTheme = fnLight;
const darkTheme = fnDark;

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#121212',
        },
      ],
    },
    docs: {
      theme: themes.light,
    },
    // Desactivar cualquier decorador global que pueda estar interfiriendo
    layout: 'fullscreen',
  },
  decorators: [withThemeProvider],
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'circlehollow', title: 'light' },
          { value: 'dark', icon: 'circle', title: 'dark' },
        ],
        showName: true,
      },
    },
  },
}

export default preview
