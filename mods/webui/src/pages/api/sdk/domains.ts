import Fonoster from '@fonoster/sdk'
import { NextApiRequest, NextApiResponse } from 'next'

import { getServerCurrentProject } from '@/mods/auth/lib/getUserLogged'
import { defaultPagination, requestHandler } from '@/mods/shared/libs/api'

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const manager = new Fonoster.Domains(getServerCurrentProject(req))

  const handlers = {
    post: async () => manager.createDomain(req.body),
    put: async () => manager.updateDomain(req.body),
    delete: async () => manager.deleteDomain(req.body.ref),
    get: async () => manager.listDomains(defaultPagination),
  }

  return requestHandler({ handlers, req, res })
}
