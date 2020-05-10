const Schema1 = require('validate')

const createAppRequest = new Schema1({
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
