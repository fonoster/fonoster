const AppManager = require('@yaps/appmanager')
const { logger, updateBucketPolicy } = require('@yaps/core')

if(process.env.NODE_ENV === 'dev' || !process.env.NODE_ENV ) {
    require('dotenv').config({ path: __dirname + '/../../.env' })
}

// Temp supressing logs
logger.transports.forEach(t => t.silent = true)

// Warning: Harcode
const endpoint = '192.168.1.149:50052'
const bucket = 'apps'

// Deploy hello-monkeys
  // Check pre-conditions
  //    - The bucket exists
  //    - Create bucket if needed
  // Get path to app
  // Read package info
  // Create instace of appmanager
  // Call createApp function

// TODO: Move this as part of the deployment process

async function deploy() {
    await updateBucketPolicy(bucket)

    const request = {
       dirPath: '/Users/pedrosanders/Projects/yaps/examples/hello-monkeys',
       app: {
           name: 'hello-monkeys',
           description: 'Simple Voice App'
       }
    }

    const appmanager = new AppManager({endpoint, bucket})

    const app = await appmanager.createApp(request)

    console.log('app: ', app)
}

deploy()
