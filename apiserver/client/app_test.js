/**
 * @author Pedro Sanders
 * @since v1
 */
const YAPS = require('../index')

// Create Resources service instance
const app = new YAPS.App()
const gateway = new YAPS.Gateway()

const appResource = {ref: 1, name: 'hello-world', description: 'simple app example'}
const gwResource = {ref: 2, name: 'hello-world', description: 'simple app example'}

app.createApp(appResource).
then(result => console.log('result: ', result))
.catch(e => console.error(e))

// List apps
app.listApps()
.then(result => console.log('received stream: ', result))
.catch(e => console.log(e))

gateway.createGateway(gwResource).
then(result => console.log('result: ', result))
.catch(e => console.error(e))
