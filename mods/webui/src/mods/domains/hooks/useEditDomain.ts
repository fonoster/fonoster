import type {
  CreateDomainRequest,
  CreateDomainResponse,
} from '@fonoster/domains/dist/client/types'
import { useMutation, useQueryClient } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useEditDomain = () => {
  const queryClient = useQueryClient()

  return useMutation(
    async (domain: CreateDomainRequest) =>
      (await API.put('/domains', domain)).data.data as CreateDomainResponse,
    {
      onSuccess() {
        queryClient.invalidateQueries('domains')
      },
    }
  )
}
