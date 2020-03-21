const Schema = require('validate')

const createAppRequest = new Schema({
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
