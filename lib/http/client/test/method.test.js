const Log = require('@kelchy/log')
const Method = require('../method')
const Client = require('../index')
const axios = require('axios')
jest.mock('axios')
axios.mockResolvedValue({ data: {} })

const client = new Client()
const url = 'http://www.domain.com'
const testOptions = { headers: 'test header', timeout: 10000 }

afterEach(() => {
  jest.clearAllMocks()
})

describe('http method tests', () => {
  test('new empty instance should have minimal properties: log, timeout', (done) => {
    const method = new Method()
    expect(method).toHaveProperty('log')
    expect(method).toHaveProperty('timeout')
    done()
  })
  test('instance with log should have minimal properties: log, timeout', (done) => {
    const log = new Log.Standard()
    const method = new Method({ log })
    expect(method).toHaveProperty('log')
    expect(method).toHaveProperty('timeout')
    done()
  })
  test('get should get with no options', async () => {
    const res = await client.get(url)
    expect(res).toEqual({})
    expect(axios).toHaveBeenCalledWith({
      method: 'get',
      url,
      headers: undefined,
      timeout: 30000
    })
  })
  test('get should get with options', async () => {
    const res = await client.get(url, testOptions)
    expect(res).toEqual({})
    expect(axios).toHaveBeenCalledWith({
      method: 'get',
      url,
      headers: testOptions.headers,
      timeout: testOptions.timeout
    })
  })
  test('post should post with no options', async () => {
    const res = await client.post(url, {})
    expect(res).toEqual({})
    expect(axios).toHaveBeenCalledWith({
      method: 'post',
      url,
      data: {},
      headers: undefined,
      timeout: 30000
    })
  })
  test('post should post with options', async () => {
    const res = await client.post(url, {}, testOptions)
    expect(axios).toHaveBeenCalledWith({
      method: 'post',
      url,
      data: {},
      headers: testOptions.headers,
      timeout: testOptions.timeout
    })
    expect(res).toEqual({})
  })
  test('put should put without options', async () => {
    const res = await client.put(url, {})
    expect(axios).toHaveBeenCalledWith({
      method: 'put',
      url,
      data: {},
      headers: undefined,
      timeout: 30000
    })
    expect(res).toEqual({})
  })
  test('put should put with options', async () => {
    const res = await client.put(url, {}, testOptions)
    expect(axios).toHaveBeenCalledWith({
      method: 'put',
      url,
      data: {},
      headers: testOptions.headers,
      timeout: testOptions.timeout
    })
    expect(res).toEqual({})
  })
  test('delete should delete without options', async () => {
    const res = await client.delete(url)
    expect(axios).toHaveBeenCalledWith({
      method: 'delete',
      url,
      headers: undefined,
      timeout: 30000
    })
    expect(res).toEqual({})
  })
  test('delete should delete with options', async () => {
    const res = await client.delete(url, testOptions)
    expect(axios).toHaveBeenCalledWith({
      method: 'delete',
      url,
      headers: testOptions.headers,
      timeout: testOptions.timeout
    })
    expect(res).toEqual({})
  })
  test('patch should patch without options', async () => {
    const res = await client.patch(url, {})
    expect(axios).toHaveBeenCalledWith({
      method: 'patch',
      url,
      data: {},
      headers: undefined,
      timeout: 30000
    })
    expect(res).toEqual({})
  })
  test('patch should patch with options', async () => {
    const res = await client.patch(url, {}, testOptions)
    expect(axios).toHaveBeenCalledWith({
      method: 'patch',
      url,
      data: {},
      headers: testOptions.headers,
      timeout: testOptions.timeout
    })
    expect(res).toEqual({})
  })
  test('axios error should error', async () => {
    const err = {
      config: {
        url: 'url',
        method: 'method',
        headers: {}
      }
    }
    axios.mockRejectedValue(err)
    expect(client.get(url)).rejects.toEqual(err)
  })
})
