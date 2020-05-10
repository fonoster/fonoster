export {}

const { fsInstance } = require('./utils')
const policy = require('./bucket_policy')
const logger = require('./logger')

module.exports = async (bucket: string) => {
  try {
    const fsConn = fsInstance()
    const exists = await fsConn.bucketExists(bucket)

    if (!exists) {
      logger.log(
        'verbose',
        `@yaps/core fsutils [Creating storage and setting policy bucket: ${bucket}]`
      )
      await fsConn.makeBucket(bucket, 'us-west-1')
      await fsConn.setBucketPolicy(bucket, policy(bucket))
    }
  } catch (err) {
    throw err
  }
}
