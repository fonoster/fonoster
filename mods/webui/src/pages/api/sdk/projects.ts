import Fonoster from '@fonoster/sdk'
import { NextApiRequest, NextApiResponse } from 'next'

import { getUserLogged } from '@/mods/auth/lib/getUserLogged'
import { requestHandler } from '@/mods/shared/libs/api'

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const manager = new Fonoster.Projects(await getUserLogged(req))

  const handlers = {
    post: async () => manager.createProject(req.body),
    put: async () => manager.updateProject(req.body),
    delete: async () => manager.deleteProject(req.body.ref),
    get: async () => manager.listProjects(),
    patch: async () => manager.renewAccessKeySecret({ ref: req.body.ref }),
  }

  return requestHandler({ handlers, req, res })
}
