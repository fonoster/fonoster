import Fonoster from '@fonoster/sdk'
import { NextApiRequest, NextApiResponse } from 'next'

import { getServerCurrentProject } from '@/mods/auth/lib/getUserLogged'
import { defaultPagination, requestHandler } from '@/mods/shared/libs/api'

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const manager = new Fonoster.Numbers(getServerCurrentProject(req))

  const handlers = {
    post: async () => manager.createNumber(req.body),
    put: async () => manager.updateNumber(req.body),
    delete: async () => manager.deleteNumber(req.body.ref),
    get: async () => manager.listNumbers(defaultPagination),
  }

  return requestHandler({ handlers, req, res })
}
