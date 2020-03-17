/**
 * @author Pedro Sanders
 * @since v1
 */
const { fsInstance } = require('./utils')
const logger = require('./logger')

module.exports = bucket => {

    // Bucket policy - GET requests on "storageBucket" bucket will not need authentication.
    const policy = `
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Action": [
            "s3:GetBucketLocation",
            "s3:ListBucket"
          ],
          "Effect": "Allow",
          "Principal": {
            "AWS": [
              "*"
            ]
          },
          "Resource": [
            "arn:aws:s3:::${bucket}"
          ],
          "Sid": ""
        },
        {
          "Action": [
            "s3:GetObject"
          ],
          "Effect": "Allow",
          "Principal": {
            "AWS": [
              "*"
            ]
          },
          "Resource": [
            "arn:aws:s3:::${bucket}/*"
          ],
          "Sid": ""
        }
      ]
    }
    `

    fsConn = fsInstance()

    fsConn.bucketExists(bucket, (err, exists) => {
        if (err) throw err

        if (!exists) {
            logger.log('verbose', `@yaps/core fsutils [Creating storage bucket: ${bucket}]`)
            fsConn.makeBucket(bucket, 'us-west-1', err => {
                if (err) throw err
                fsConn.setBucketPolicy(bucket, policy, err => {
                   if (err) throw err
                   logger.log('verbose', `@yaps/core fsutils [Bucket policy changed for bucket: ${bucket}]`)
                })
            })

        }
    })
}
