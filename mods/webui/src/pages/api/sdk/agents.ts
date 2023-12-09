import Fonoster from '@fonoster/sdk'
import { NextApiRequest, NextApiResponse } from 'next'

import { getServerCurrentProject } from '@/mods/auth/lib/getUserLogged'
import { defaultPagination, requestHandler } from '@/mods/shared/libs/api'

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const manager = new Fonoster.Agents(getServerCurrentProject(req))

  const handlers = {
    post: async () => manager.createAgent(req.body),
    put: async () => manager.updateAgent(req.body),
    delete: async () => manager.deleteAgent(req.body.ref),
    get: async () => manager.listAgents(defaultPagination),
  }

  return requestHandler({ handlers, req, res })
}
