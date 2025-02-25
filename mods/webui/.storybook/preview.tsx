import React from 'react'
import type { Preview } from '@storybook/react'
import { StoriesProvider } from './providers/StoriesProvider'

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <StoriesProvider>
        <Story />
      </StoriesProvider>
    ),
  ],
}

export default preview
