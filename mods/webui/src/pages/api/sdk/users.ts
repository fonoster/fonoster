import Fonoster from '@fonoster/sdk'
import { NextApiRequest, NextApiResponse } from 'next'

import { getUserLogged } from '@/mods/auth/lib/getUserLogged'
import { requestHandler } from '@/mods/shared/libs/api'

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const credentials = await getUserLogged(req)

  const manager = new Fonoster.Auth()
  const userManager = new Fonoster.Users(credentials)

  const handlers = {
    get: async () => userManager.getUser(req.query.ref as string),
    put: async () =>
      userManager.updateUser({ ...req.body, ref: credentials.accessKeyId }),
    patch: async () =>
      manager.createToken({ accessKeyId: credentials.accessKeyId }),
  }

  return requestHandler({ handlers, req, res })
}
