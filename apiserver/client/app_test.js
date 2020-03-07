/**
 * @author Pedro Sanders
 * @since v1
 */
const YAPS = require('../index')

// Create App service instance
const app = new YAPS.App()

app.createApp({ref: 1, name: 'hello-world', description: 'simple app example'}).
then(result => console.log('result: ', result))
.catch(e => console.log(e))

// List apps
app.listApps()
.then(result => console.log('Client: Stream Message Received = ', result))
.catch(e => console.log(e))
