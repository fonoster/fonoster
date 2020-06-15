export default async function listNumbers (call: any, callback: any) {
  if (!auth(call)) return callback(new FonosAuthError())

  if (!call.request.getPageToken()) {
    // Nothing to send
    callback(null, new ListNumbersResponse())
    return
  }

  const page = parseInt(call.request.getPageToken()) + 1
  const itemsPerPage = call.request.getPageSize()

  await routr.connect()
  const result = await routr
    .resourceType('numbers')
    .list({ page, itemsPerPage })
  const numbers = result.data

  const response = new ListNumbersResponse()

  for (const jsonObj in numbers) {
    const number = numberDecoder(jsonObj)
    response.addNumbers(number)
  }

  if (numbers.length > 0) response.setNextPageToken('' + (page + 1))

  callback(null, response)
}
