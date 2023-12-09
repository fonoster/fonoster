import type { CreateTokenResponse } from '@fonoster/auth/dist/client/types'
import { useMutation } from 'react-query'

import { API } from '@/mods/shared/libs/api'

export const useRefreshSecret = () =>
  useMutation(
    async () => (await API.patch('/users')).data.data as CreateTokenResponse
  )
