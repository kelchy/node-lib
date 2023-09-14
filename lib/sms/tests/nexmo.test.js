const common = require('@kelchy/common')
const Nexmo = require('../nexmo')

jest.spyOn(console, 'log').mockImplementation()
jest.spyOn(console, 'error').mockImplementation()

jest.mock('@vonage/auth', () => {
  return {
    Auth: jest.fn().mockImplementation(() => {})
  }
})

jest.mock('@vonage/server-sdk', () => {
  return {
    Vonage: jest.fn().mockImplementation(() => {
      return {
        sms: {
          send: jest.fn()
        }
      }
    })
  }
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('sms tests', () => {
  test('new empty instance should have minimal properties: client, from, log', async () => {
    const nexmo = new Nexmo('key', 'secret', 'from')
    expect(nexmo).toHaveProperty('client')
    expect(nexmo).toHaveProperty('from')
    expect(nexmo).toHaveProperty('log')
  })
  test('new empty instance without params should error', async () => {
    expect(() => { return new Nexmo('', 'secret', 'from') }).toThrow('NEXMO_CREDENTIALS_EMPTY')
    expect(() => { return new Nexmo('key', '', 'from') }).toThrow('NEXMO_CREDENTIALS_EMPTY')
    expect(() => { return new Nexmo('key', 'secret', '') }).toThrow('NEXMO_CREDENTIALS_EMPTY')
  })
  test('send text should send', async () => {
    const nexmo = new Nexmo('key', 'secret', 'from')
    nexmo.client.sms.send.mockResolvedValue({ messages: [{ status: '0' }] })
    const response = await nexmo.send('from', 'text')
    expect(response).toEqual({ status: '0' })
  })
  test('send text error should error', async () => {
    const nexmo = new Nexmo('key', 'secret', 'from')
    nexmo.client.sms.send.mockRejectedValue(new Error('ERROR'))
    const { error } = await common.awaitWrap(nexmo.send('from', 'text'))
    expect(error).toEqual(new Error('ERROR'))
  })
  test('send text unknown error should error', async () => {
    const nexmo = new Nexmo('key', 'secret', 'from')
    nexmo.client.sms.send.mockResolvedValue('unknown')
    const { error } = await common.awaitWrap(nexmo.send('from', 'text'))
    expect(error).toEqual(new Error('NEXMO_UNKNOWN_ERROR'))
  })
  test('send text error should error', async () => {
    const nexmo = new Nexmo('key', 'secret', 'from')
    nexmo.client.sms.send.mockResolvedValue({ messages: [{ 'error-text': 'error' }] })
    const { error } = await common.awaitWrap(nexmo.send('from', 'text'))
    expect(error).toEqual(new Error('error'))
  })
})
