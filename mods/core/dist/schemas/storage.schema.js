var Schema = require('validate')
var uploadObjectRequest = new Schema({
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
  }
})
var getObjectURLRequest = new Schema({
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
  uploadObjectRequest: uploadObjectRequest,
  getObjectURLRequest: getObjectURLRequest
}
//# sourceMappingURL=storage.schema.js.map
