import { Button as ButtonUI } from '@supabase/ui'
import type { ButtonProps } from '@supabase/ui/dist/cjs/components/Button/Button'
import React from 'react'

export const Button: React.FC<ButtonProps> = props => (
  <ButtonUI size="medium" {...props} />
)
