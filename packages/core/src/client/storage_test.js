/**
 * @author Pedro Sanders
 * @since v1
 */
// require('@yaps/storage')
// require('@yaps/voice')
// require('@yaps/resources')

const YAPS = require('../index')
// Create Resources service instance
const yaps = new YAPS.App()

const app = { ref: 1, name: 'hello-world', description: 'simple app example' }

yaps.app.create(appResource)
.then(result => console.log('result: ', result))
.catch(e => console.error(e))
