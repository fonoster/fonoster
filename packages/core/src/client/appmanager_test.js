/**
 * @author Pedro Sanders
 * @since v1
 */
const YAPS = require('@yaps/sdk')
const app = new YAPS.AppConfig({ endpoint: '', })
const storage = new YAPS.Storage()
//const sipnet = new YAPS.SIPNet() Not y
const vault = new YAPS.Vault()
const vault = new YAPS.Caller()

const request = { name: 'hello-world', description: 'simple app example' }

app.createApp(request)
.then(result => console.log('result: ', result))
.catch(e => console.error(e))
