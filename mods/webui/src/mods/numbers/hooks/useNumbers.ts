import type { Number } from '@fonoster/numbers/dist/client/types'
import { useQuery } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useNumbers = (queryKey = 'numbers') => {
  const { data, isLoading, isSuccess } = useQuery<{
    nextPageToken: string
    numbers: Number[]
  }>([queryKey], async () => (await API.get('/numbers')).data.data)

  return {
    numbers: data?.numbers ?? [],
    isLoading,
    isSuccess,
  }
}
