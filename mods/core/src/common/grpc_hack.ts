// I have to place this here because you cannot require this libray
// from the client, using npm link :(
const grpc = require('grpc')
export { grpc as default }
