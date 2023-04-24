const axios = require('axios')
const Log = require('../index')

jest.mock('axios', () => {
  return {
    post: jest.fn().mockResolvedValue(true)
  }
})

afterEach(() => {
  jest.clearAllMocks()
})

jest.spyOn(console, 'log').mockImplementation()
jest.spyOn(console, 'debug').mockImplementation()
jest.spyOn(console, 'error').mockImplementation()

describe('logging tests', () => {
  test('new empty instance should have minimal properties: out, debug and error', (done) => {
    const log = new Log.Empty()
    expect(log).toHaveProperty('out')
    expect(log).toHaveProperty('debug')
    expect(log).toHaveProperty('error')
    log.out() // no impact, just for coverage
    log.debug() // no impact, just for coverage
    log.error() // no impact, just for coverage
    expect(Log.isValid(log)).toEqual(true)
    done()
  })
  test('new erroronly instance should have minimal properties: out, debug and error', (done) => {
    const log = new Log.ErrorOnly()
    expect(log).toHaveProperty('out')
    expect(log).toHaveProperty('debug')
    expect(log).toHaveProperty('error')
    log.out() // no impact, just for coverage
    log.debug() // no impact, just for coverage
    log.error() // no impact, just for coverage
    expect(Log.isValid(log)).toEqual(true)
    done()
  })
  test('new standard instance should have minimal properties: out, debug and error', (done) => {
    const log = new Log.Standard()
    expect(log).toHaveProperty('out')
    expect(log).toHaveProperty('debug')
    expect(log).toHaveProperty('error')
    log.out('scope', 'msg', { datetime: '2021-01-01' })
    expect(console.log).toHaveBeenCalledWith(JSON.stringify({ scope: 'scope', msg: 'msg', ts: '2021-01-01T00:00:00.000Z' }))
    log.debug('scope', 'msg')
    expect(console.debug).toHaveBeenCalledTimes(0)
    log.error('scope', 'msg')
    expect(console.error).toHaveBeenCalledTimes(1)
    expect(Log.isValid(log)).toEqual(true)
    done()
  })
  test('dateFormat null for standard logging should remove date from log', (done) => {
    const log = new Log.Standard()
    log.dateFormat = null
    log.out('scope', 'msg')
    expect(console.log).toHaveBeenCalledWith(JSON.stringify({ scope: 'scope', msg: 'msg' }))
    log.out('scope', { msg: '123' })
    expect(console.log).toHaveBeenCalledWith(JSON.stringify({ scope: 'scope', msg: '123' }))
    log.out({ scope: 'scope', msg: '123' })
    expect(console.log).toHaveBeenCalledWith(JSON.stringify({ scope: 'scope', msg: '123' }))
    done()
  })
  test('json false for erroronly logging should remove json formatting', (done) => {
    const log = new Log.ErrorOnly({ json: false })
    log.error('scope', 'msg', { datetime: '2021-01-01' })
    expect(console.error).toHaveBeenCalledWith('2021-01-01T00:00:00.000Z', 'scope', 'msg')
    done()
  })
  test('error instance should have stack', (done) => {
    const logE = new Log.ErrorOnly()
    logE.error('scope', new Error('error'))
    expect(console.error).toHaveBeenLastCalledWith(expect.stringMatching(/.*stack.*/))
    const logS = new Log.Standard()
    logS.error('scope', new Error('error'))
    expect(console.error).toHaveBeenLastCalledWith(expect.stringMatching(/.*stack.*/))
    done()
  })
  test('json false for standard logging should remove json formatting', (done) => {
    const log = new Log.Standard({ json: false })
    log.out('scope', 'msg', { datetime: '2021-01-01' })
    expect(console.log).toHaveBeenCalledWith('2021-01-01T00:00:00.000Z', 'scope', 'msg')
    log.dateFormat = null
    log.error('scope', 'msg')
    expect(console.error).toHaveBeenCalledWith('scope', 'msg')
    done()
  })
  test('debugging true for standard logging should log debug messages', (done) => {
    const log = new Log.Standard()
    log.dateFormat = null
    log.json = null
    log.debugging = true
    log.debug('scope', 'msg')
    expect(console.debug).toHaveBeenCalledWith('scope', 'msg')
    done()
  })
  test('dateFormat epoch shoud log date in timestamp since epoch in milliseconds', (done) => {
    const log = new Log.Standard()
    log.dateFormat = 'epoch'
    log.out('scope', 'msg', { datetime: '2021-01-01' })
    expect(console.log).toHaveBeenCalledWith(JSON.stringify({ scope: 'scope', msg: 'msg', ts: '1609459200000' }))
    done()
  })
  test('dateFormat invalid should log date in iso format', (done) => {
    const log = new Log.Standard()
    log.dateFormat = 'invalid'
    log.out('scope', 'msg', { datetime: '2021-01-01' })
    expect(console.log).toHaveBeenCalledWith(JSON.stringify({ scope: 'scope', msg: 'msg', ts: '2021-01-01T00:00:00.000Z' }))
    done()
  })
  test('slack should send message to slack', async () => {
    // no impact, only for coverage
    const Methods = require('../methods')
    const methods = new Methods()
    expect(methods).toHaveProperty('slackOptions')

    let log = new Log.Empty({ slack: { token: 'abc' } })
    await log.slack({ text: '123' })
    expect(axios.post).toHaveBeenLastCalledWith('https://hooks.slack.com/services/abc', { icon_emoji: ':ghost:', text: '123' }, { timeout: 20000 })
    await log.slack('123')
    expect(axios.post).toHaveBeenCalledTimes(1)
    log = new Log.Empty()
    await log.slack('123')
    expect(axios.post).toHaveBeenCalledTimes(1)
    log = new Log.Empty({ slack: { token: 'abc', username: 'user' } })
    await log.slack({ text: '123', channel: '#channel', icon_emoji: 'icon' })
    expect(axios.post).toHaveBeenLastCalledWith('https://hooks.slack.com/services/abc', { channel: '#channel', icon_emoji: 'icon', text: '123', username: 'user' }, { timeout: 20000 })
    log = new Log.Empty({ slack: { token: 'abc', channel: '#channel' } })
    await log.slack({ text: '123', username: 'user' })
    expect(axios.post).toHaveBeenLastCalledWith('https://hooks.slack.com/services/abc', { channel: '#channel', icon_emoji: ':ghost:', text: '123', username: 'user' }, { timeout: 20000 })

    axios.post.mockRejectedValue(new Error('error'))
    expect(log.slack({ text: 'error' })).resolves.toEqual(undefined)
  })
})
