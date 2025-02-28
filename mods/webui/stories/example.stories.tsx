/*
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Button } from './button/Button'
import { fn } from '@storybook/test'

/**
 * Example story that demonstrates how to use the Material UI theme.
 */
const meta = {
  title: 'Examples/Using Theme',
  component: Button,
  parameters: {
    layout: 'padded'
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div style={{ padding: '20px' }}>
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Example of a button with the theme applied.
 */
export const ThemedButton: Story = {
  args: {
    children: 'Themed Button',
    variant: 'contained',
    color: '#000000',
    onClick: fn()
  }
}

/**
 * Another example with a different variant.
 */
export const OutlinedButton: Story = {
  args: {
    children: 'Outlined Button',
    variant: 'outlined',
    color: 'primary',
    onClick: fn()
  }
}
