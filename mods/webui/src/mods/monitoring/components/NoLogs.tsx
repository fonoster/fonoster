import { ClipboardListIcon } from '@heroicons/react/outline'
import React from 'react'

import { Empty } from '@/ui'

export const NoLogs: React.FC = () => (
  <Empty
    title="No Logs"
    message="You will be able to view all your activity once you get started using your resources."
    icon={ClipboardListIcon}
  />
)
