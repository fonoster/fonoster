import Fonoster from '@fonoster/sdk'
import { NextApiRequest, NextApiResponse } from 'next'

import { getServerCurrentProject } from '@/mods/auth/lib/getUserLogged'
import { defaultPagination, requestHandler } from '@/mods/shared/libs/api'

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const manager = new Fonoster.Secrets(getServerCurrentProject(req))

  const handlers = {
    post: async () => manager.createSecret(req.body),
    delete: async () => manager.deleteSecret(req.body.name),
    get: async () => manager.listSecrets(defaultPagination),
  }

  return requestHandler({ handlers, req, res })
}
