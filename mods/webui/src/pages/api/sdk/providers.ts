import Fonoster from '@fonoster/sdk'
import { NextApiRequest, NextApiResponse } from 'next'

import { getServerCurrentProject } from '@/mods/auth/lib/getUserLogged'
import { defaultPagination, requestHandler } from '@/mods/shared/libs/api'

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const manager = new Fonoster.Providers(getServerCurrentProject(req))

  const handlers = {
    post: async () => manager.createProvider(req.body),
    put: async () => manager.updateProvider(req.body),
    delete: async () => manager.deleteProvider(req.body.ref),
    get: async () => manager.listProviders(defaultPagination),
  }

  return requestHandler({ handlers, req, res })
}
