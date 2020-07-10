import { join } from 'path'

if (process.env.NODE_ENV === 'dev') {
  require('dotenv').config({
    path: join(__dirname, '..', '..', '..', '..', '.env')
  })
}

import logger from '@fonos/logger'
import policy from './bucket_policy'
import { fsInstance } from './utils'

export default async function updateBucketPolicy (bucket: string) {
  try {
    const fsConn = fsInstance()
    const exists = await fsConn.bucketExists(bucket)

    if (!exists) {
      logger.log(
        'verbose',
        `@fonos/core fsutils [Creating storage and setting policy bucket: ${bucket}]`
      )
      await fsConn.makeBucket(bucket, 'us-west-1')
      await fsConn.setBucketPolicy(bucket, policy(bucket))
    }
  } catch (err) {
    throw err
  }
}

updateBucketPolicy('apps')
updateBucketPolicy('default')
