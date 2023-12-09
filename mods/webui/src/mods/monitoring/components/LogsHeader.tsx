import { Time } from '@/mods/shared/constants/filters'
import { Text } from '@/ui'

import { ShowByTimeSelector } from './ShowByTimeSelector'

export const LogsHeader: React.FC<{
  total: number
  onChange: (data: Time) => void
}> = ({ onChange, total }) => (
  <div className="flex justify-between items-center mb-4">
    <ShowByTimeSelector onChange={onChange} />

    <Text className="m-0">Showing {total} logs</Text>
  </div>
)
