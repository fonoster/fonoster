const Minio = require('minio')

// Instantiate the minio client with the endpoint
// and access keys as shown below.
const minioClient = new Minio.Client({
    endPoint: '127.0.0.1',
    port: 9001,
    useSSL: false,
    accessKey: 'minio',
    secretKey: 'minio123'
});

// File that needs to be uploaded.
const file = '/tmp/screenshot.png'

// Make a bucket called europetrip.
minioClient.makeBucket('europetrip1', 'us-east-1', err => {
    if (err) return console.log(err)

    console.log('Bucket created successfully in "us-east-1".')

    const metaData = {
        'Content-Type': 'application/octet-stream',
        'X-Amz-Meta-Testing': 1234,
        'example': 5678
    }
    // Using fPutObject API upload your file to the bucket europetrip.
    minioClient.fPutObject('europetrip', 'screenshot.png', file, metaData, (err, etag) => {
      if (err) return console.log(err)
      console.log('File uploaded successfully.')
    });
});
