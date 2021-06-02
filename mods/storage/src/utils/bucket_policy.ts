// Bucket policy - GET requests on "storageBucket" while skiping authentication.
export default function (bucket: string): string {
  return `
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
  `;
}
