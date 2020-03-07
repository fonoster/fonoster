/**
 * @author Pedro Sanders
 * @since v1
 */
class Storage {

    constructor(options) {
        config = config || {}
    }

    uploadFile(object, bucket) {}
    deleteFile(object, bucket) {}
    getFileURL(object, bucket) {}
    createBucket(bucket) {}
    deleteBucket(bucket) {}
    getBucketMetadata(bucket) {}

}

const storage = new YAPS.Storage({apiVersion: '2010-12-01'})
