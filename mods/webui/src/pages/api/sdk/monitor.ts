const Monitor = require('@fonoster/monitor/dist/client/monitor')
import { NextApiRequest, NextApiResponse } from 'next'

import { getServerCurrentProject } from '@/mods/auth/lib/getUserLogged'
import { TIMES, validateTimeFilter } from '@/mods/shared/constants/filters'
import { requestHandler } from '@/mods/shared/libs/api'

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const monitor = new Monitor(getServerCurrentProject(req))

  const get = async () => {
    const { time = TIMES[0].value, eventType, level } = req.query

    validateTimeFilter(time as string)

    const must: any[] = []

    if (level) {
      must.push({
        match: {
          level,
        },
      })
    }

    if (eventType) {
      must.push({
        match: {
          eventType,
        },
      })
    }

    return monitor.searchEvents({
      query: {
        bool: {
          must,
          filter: {
            range: {
              '@timestamp': {
                gte: time,
              },
            },
          },
        },
      },
    })
  }

  return requestHandler({ handlers: { get }, req, res })
}
