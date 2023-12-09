import Fonoster from '@fonoster/sdk'
import { NextApiRequest, NextApiResponse } from 'next'

import { getServerCurrentProject } from '@/mods/auth/lib/getUserLogged'
import { defaultPagination, requestHandler } from '@/mods/shared/libs/api'

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const manager = new Fonoster.Apps(getServerCurrentProject(req))

  const handlers = {
    post: async () => manager.createApp(req.body),
    put: async () =>
      manager.updateApp({
        ...req.body,
        createTime: undefined,
        updateTime: undefined,
      }),
    delete: async () => manager.deleteApp(req.body.ref),
    get: async () => manager.listApps(defaultPagination),
  }

  return requestHandler({ handlers, req, res })
}
