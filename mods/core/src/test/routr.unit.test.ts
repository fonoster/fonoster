import chai from 'chai'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import { join } from 'path'

const expect = chai.expect
chai.use(sinonChai)
chai.use(chaiAsPromised)

if (process.env.NODE_ENV === 'dev') {
  require('dotenv').config({ path: join(__dirname, '..', '..', '..', '.env') })
}

import RoutrClient from '../common/routr_client'

const host = process.env.SIPPROXY_HOST || 'localhost'
const port = process.env.SIPPROXY_API_PORT || '4567'

const rConfig = {
  username: process.env.SIPPROXY_API_USERNAME || 'admin',
  secret: process.env.SIPPROXY_API_SECRET || 'changeit',
  apiUrl: `https://${host}:${port}/api/v1beta1`
}

const agent = {
  apiVersion: 'v1beta1',
  kind: 'Agent',
  metadata: {
    name: 'John',
    ref: 'acv2'
  },
  spec: {
    credentials: {
      username: 'test',
      secret: '1234'
    },
    domains: ['sip.local']
  }
}

describe('Routr Server', () => {
  let routr: any
  before(async () => {
    console.log(`=> ${JSON.stringify(rConfig)}`)
    routr = new RoutrClient(rConfig.apiUrl, rConfig.username, rConfig.secret)
    await routr.connect()
  })

  it.only('creates new agent', () => {
    expect(routr.resourceType('agents').create(agent)).fulfilled
    expect(routr.resourceType('agents').create(agent)).fulfilled
  })

  it('fails because of bad reference', () => {
    agent.metadata.ref = ''
    expect(routr.resourceType('agents').create(agent)).to.be.rejectedWith(
      'FonosFailedPrecondition: $[0].metadata.ref: must be at least 3 characters long'
    )
  })

  it('deletes the agent', () => {
    expect(routr.resourceType('agents').delete(agent.metadata.ref)).to.be
      .fulfilled
  })
})
