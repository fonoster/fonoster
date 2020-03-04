const Minio = require('minio')

module.exports = storageBucket => {

    const minioClient = new Minio.Client({
        endPoint: process.env.FS_HOST,
        port: parseInt(process.env.FS_PORT),
        useSSL: false,
        accessKey: process.env.FS_USERNAME,
        secretKey: process.env.FS_SECRET
    })

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
            "arn:aws:s3:::${storageBucket}"
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
            "arn:aws:s3:::${storageBucket}/*"
          ],
          "Sid": ""
        }
      ]
    }
    `

    minioClient.bucketExists(storageBucket, (err, exists) => {
        if (err) throw err

        if (!exists) {
            console.log(`Creating storage bucket: ${storageBucket}`)
            minioClient.makeBucket(storageBucket, 'us-west-1', err => {
                if (err) throw err
                minioClient.setBucketPolicy(storageBucket, policy, err => {
                   if (err) throw err
                   console.log('Setting bucket policy')
                })
            })

        }
    })
}
