var Minio = require('minio')

var minioClient = new Minio.Client({
  endPoint: 'fs',
  port: 9000,
  useSSL: false,
  accessKey: 'minio',
  secretKey: 'minio123'
})

// Bucket policy - GET requests on "default" bucket will not need authentication.
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
        "arn:aws:s3:::default"
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
        "arn:aws:s3:::default/*"
      ],
      "Sid": ""
    }
  ]
}
`

minioClient.setBucketPolicy('default', policy, (err) => {
	if (err) throw err
	console.log('Set bucket policy')
})

console.log('AGI Server Ready.')
