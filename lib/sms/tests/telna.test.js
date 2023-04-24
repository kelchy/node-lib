const axios = require('axios')
const common = require('@kelchy/common')
const Telna = require('../telna')

jest.mock('axios', () => {
  return {
    post: jest.fn(async (url, body, config) => { return { data: '' } })
  }
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('sms tests', () => {
  test('new empty instance should have minimal properties: from, log, etc', async () => {
    const telna = new Telna('key', 'secret', 'from')
    expect(telna).toHaveProperty('host')
    expect(telna).toHaveProperty('distributorId')
    expect(telna).toHaveProperty('apiKey')
    expect(telna).toHaveProperty('apiSecret')
    expect(telna).toHaveProperty('from')
    expect(telna).toHaveProperty('log')
    expect(telna).toHaveProperty('timeout')
  })
  test('new empty instance without params should error', async () => {
    expect(() => { return new Telna('', 'secret', 'from') }).toThrow('TELNA_CREDENTIALS_EMPTY')
    expect(() => { return new Telna('key', '', 'from') }).toThrow('TELNA_CREDENTIALS_EMPTY')
    expect(() => { return new Telna('key', 'secret', '') }).toThrow('TELNA_CREDENTIALS_EMPTY')
  })
  test('send text should send', async () => {
    const telna = new Telna('key', 'secret', 'from')
    axios.post.mockImplementation(async (usrl, body, config) => { return { data: '' } })
    const response = await telna.send('to', 'text')
    expect(response).toEqual({ status: '0', message: 'ok', to: 'to' })
  })
  test('send text error should error', async () => {
    const telna = new Telna('key', 'secret', 'from')
    axios.post.mockImplementation(async (usrl, body, config) => { throw new Error('ERROR') })
    const { error } = await common.awaitWrap(telna.send('to', 'text'))
    expect(error).toEqual(new Error('ERROR'))
  })
  test('send text unknown error should error', async () => {
    const telna = new Telna('key', 'secret', 'from')
    axios.post.mockImplementation(async (usrl, body, config) => { return { data: { status: 'unknown' } } })
    const { error } = await common.awaitWrap(telna.send('to', 'text'))
    expect(error).toEqual(new Error('TELNA_UNKNOWN_ERROR'))
  })
  test('send text known error should error', async () => {
    const telna = new Telna('key', 'secret', 'from')
    axios.post.mockImplementation(async (usrl, body, config) => { return { data: { status: 400, message: 'known error' } } })
    const { error } = await common.awaitWrap(telna.send('to', 'text'))
    expect(error).toEqual(new Error('known error'))
  })
})
