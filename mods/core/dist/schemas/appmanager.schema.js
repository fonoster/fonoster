var Schema1 = require('validate')
var createAppRequest = new Schema1({
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
  createAppRequest: createAppRequest
}
//# sourceMappingURL=appmanager.schema.js.map
