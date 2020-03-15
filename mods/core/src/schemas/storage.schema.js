/**
 * @author Pedro Sanders
 * @since v1
 */
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

module.exports = {
    uploadObjectRequest
}
