const Log = require('../index')

jest.mock('request-promise')

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
    done()
  })
  test('dateFormat null for standard logging should remove date from log', (done) => {
    const log = new Log.Standard()
    log.dateFormat = null
    log.out('scope', 'msg')
    expect(console.log).toHaveBeenCalledWith(JSON.stringify({ scope: 'scope', msg: 'msg' }))
    log.out('scope', { msg: '123' })
    expect(console.log).toHaveBeenCalledWith(JSON.stringify({ scope: 'scope', msg: '123' }))
    done()
  })
  test('json false for erroronly logging should remove json formatting', (done) => {
    const log = new Log.ErrorOnly({ json: false })
    log.error('scope', 'msg', { datetime: '2021-01-01' })
    expect(console.error).toHaveBeenCalledWith('2021-01-01T00:00:00.000Z', 'scope', 'msg')
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
  test('slack should send message to slack', async (done) => {
    // no impact, only for coverage
    const Methods = require('../methods')
    const methods = new Methods()
    expect(methods).toHaveProperty('slackOptions')

    const handler = jest.fn()
    const rp = require('request-promise')
    rp.mockImplementation(async (arg) => {
      if (arg.json.text === 'error') throw new Error('error')
      handler(arg.json)
    })
    let log = new Log.Empty({ slack: { token: 'abc' } })
    await log.slack({ text: '123' })
    expect(handler).toHaveBeenCalledWith({ text: '123', icon_emoji: ':ghost:' })
    await log.slack('123')
    expect(handler).toHaveBeenCalledTimes(1)
    log = new Log.Empty()
    await log.slack('123')
    expect(handler).toHaveBeenCalledTimes(1)
    log = new Log.Empty({ slack: { token: 'abc', username: 'user' } })
    await log.slack({ text: '123', channel: '#channel', icon_emoji: 'icon' })
    expect(handler).toHaveBeenLastCalledWith({ text: '123', icon_emoji: 'icon', username: 'user', channel: '#channel' })
    log = new Log.Empty({ slack: { token: 'abc', channel: '#channel' } })
    await log.slack({ text: '123', username: 'user' })
    expect(handler).toHaveBeenLastCalledWith({ text: '123', icon_emoji: ':ghost:', username: 'user', channel: '#channel' })
    try { await log.slack({ text: 'error' }) } catch (e) { expect(e).toEqual(new Error('error')) }
    done()
  })
})
