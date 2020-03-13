/**
 * @author Pedro Sanders
 * @since v1
 */
const Schema = require('validate')

const createAppRequest = new Schema({
    filePath: {
        type: String,
        required: true
    },
    app: {
        name: {
          type: String,
          required: true
        },
        description: {
          type: String,
          required: true
        }
    }
})

module.exports = {
    createAppRequest
}
