const Schema = require('validate')

const uploadObjectRequest = new Schema({
    name: {
        type: String,
        required: true
    },
    bucket: {
        type: String,
        required: true
    },
    metadata: {
        type: Object,
        required: false
    },
})

const getObjectURLRequest = new Schema({
    name: {
        type: String,
        required: true
    },
    bucket: {
        type: String,
        required: true
    }
})


module.exports = {
    uploadObjectRequest,
    getObjectURLRequest
}
