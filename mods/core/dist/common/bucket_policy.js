// Bucket policy - GET requests on "storageBucket" bucket will not need authentication.
module.exports = function (bucket) {
  return (
    '\n  {\n    "Version": "2012-10-17",\n    "Statement": [\n      {\n        "Action": [\n          "s3:GetBucketLocation",\n          "s3:ListBucket"\n        ],\n        "Effect": "Allow",\n        "Principal": {\n          "AWS": [\n            "*"\n          ]\n        },\n        "Resource": [\n          "arn:aws:s3:::' +
    bucket +
    '"\n        ],\n        "Sid": ""\n      },\n      {\n        "Action": [\n          "s3:GetObject"\n        ],\n        "Effect": "Allow",\n        "Principal": {\n          "AWS": [\n            "*"\n          ]\n        },\n        "Resource": [\n          "arn:aws:s3:::' +
    bucket +
    '/*"\n        ],\n        "Sid": ""\n      }\n    ]\n  }\n  '
  )
}
//# sourceMappingURL=bucket_policy.js.map
