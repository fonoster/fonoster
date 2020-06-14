import { FonosAuthError } from '@fonos/errors'
import routr from '../../common/routr'
import logger from '@fonos/logger'
import providerDecoder from '../../common/decoders/provider_decoder'
import { Empty } from '../protos/common_pb'
import { ListProvidersResponse } from '../protos/providers_pb'
import { REncoder, Kind } from '../../common/resource_encoder'
import { auth } from '../../common/trust_util'

const listProviders = async (call: any, callback: any) => {
  if (!auth(call)) return callback(new FonosAuthError())

  if (!call.request.getPageToken()) {
    // Nothing to send
    callback(null, new ListProvidersResponse())
    return
  }

  const page = parseInt(call.request.getPageToken()) + 1
  const itemsPerPage = call.request.getPageSize()

  await routr.connect()
  const result = await routr
    .resourceType('gateways')
    .list({ page, itemsPerPage })
  const providers = result.data

  const response = new ListProvidersResponse()

  for (const jsonObj in providers) {
    const provider = providerDecoder(jsonObj)
    response.addProviders(provider)
  }

  if (providers.length > 0) response.setNextPageToken('' + (page + 1))

  callback(null, response)
}

const createProvider = async (call: any, callback: any) => {
  if (!auth(call)) return callback(new FonosAuthError())

  const provider = call.request.getProvider()

  logger.info(
    'verbose',
    `@fonos/core createProvider [entity ${provider.getName()}]`
  )

  let encoder = new REncoder(Kind.GATEWAY, provider.getName(), provider.getRef())
    .withCredentials(provider.getUsername(), provider.getSecret())
    .withHost(provider.getHost())
    .withTransport(provider.getTransport())
    .withExpires(provider.getExpires())

  const resource = encoder.build()

  logger.log(
    'debug',
    `@fonos/core createProvider [resource: ${JSON.stringify(resource)}]`
  )

  try {
    await routr.connect()
    //const ref = await routr.resourceType('gateways').create(resource)
    // We do this to get updated metadata from Routr
    //const jsonObj = await routr.resourceType('gateways').get(ref)
    //callback(null, providerDecoder(jsonObj))
  } catch (err) {
    return callback(err)
  }
}

const getProvider = async (call: any, callback: any) => {
  if (!auth(call)) return callback(new FonosAuthError())

  const providerRef = call.request.getRef()

  logger.info('verbose', `@fonos/core getProvider [ref ${providerRef}]`)

  try {
    await routr.connect()
    const jsonObj = await routr.resourceType('gateways').get(providerRef)
    callback(null, providerDecoder(jsonObj))
  } catch (err) {
    return callback(err)
  }
}

const updateProvider = async (call: any, callback: any) => {
  if (!auth(call)) return callback(new FonosAuthError())

  const provider = call.request.getProvider()

  logger.info(
    'verbose',
    `@fonos/core updateProvider [entity ${provider.getName()}]`
  )

  let encoder = new REncoder(
    Kind.GATEWAY,
    provider.getName(),
    provider.getRef()
  )
    .withMetadata({
      createdOn: provider.getCreateTime(),
      modifiedOn: provider.getUpdateTime()
    })
    .withCredentials(provider.getUsername(), provider.getSecret())
    .withHost(provider.getHost())
    .withTransport(provider.getTransport())
    .withExpires(provider.getExpires())

  const resource = encoder.build()

  logger.log(
    'debug',
    `@fonos/core updateProvider [resource: ${JSON.stringify(resource)}]`
  )

  try {
    await routr.connect()
    const ref = await routr.resourceType('gateways').update(resource)
    // We do this to get updated metadata from Routr
    const jsonObj = await routr.resourceType('gateways').get(ref)
    callback(null, providerDecoder(jsonObj))
  } catch (err) {
    return callback(err)
  }
}

const deleteProvider = async (call: any, callback: any) => {
  if (!auth(call)) return callback(new FonosAuthError())

  const providerRef = call.request.getRef()

  logger.info('verbose', `@fonos/core deleteProvider [ref ${providerRef}]`)

  try {
    await routr.connect()
    await routr.resourceType('gateways').delete(providerRef)
    callback(null, new Empty())
  } catch (err) {
    return callback(err)
  }
}

export {
  listProviders,
  createProvider,
  getProvider,
  deleteProvider,
  updateProvider
}

