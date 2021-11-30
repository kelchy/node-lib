const Redis = require('../index')

jest.mock('ioredis', () => {
  const EventEmitter = require('events').EventEmitter
  const I = class Ioredis extends EventEmitter {
    constructor (uri = '', options = {}) {
      super()
      this.dnsLookup = options.dnsLookup
    }

    testEmit (chan, msg) {
      this.emit(chan, msg)
    }

    testDnsLookup (address, callback) {
      this.dnsLookup(address, callback)
    }
  }
  I.Cluster = I
  return I
})

const redis = new Redis('redis://host:6327')
const pubsub = new Redis('redis://host:6327', { pubsub: true, cluster: false })

describe('redis events - dnslookup should return address', () => {
  test('callback test', (done) => {
    redis.client.testDnsLookup('123.com', (temp, address) => {
      expect(address).toEqual('123.com')
      done()
    })
  })
})
describe('redis events tests', () => {
  test('client ready event should emit', (done) => {
    const ready = jest.fn()
    redis.on('RedisReady', ready)
    redis.client.testEmit('ready')
    redis.removeListener('RedisReady', ready)
    expect(ready).toHaveBeenCalled()
    done()
  })
  test('client error event should emit', (done) => {
    const error = jest.fn()
    redis.on('RedisError', error)
    redis.client.testEmit('error', new Error())
    redis.removeListener('RedisError', error)
    expect(error).toHaveBeenCalled()
    done()
  })
  test('client end event should emit', (done) => {
    const end = jest.fn()
    redis.on('RedisEnd', end)
    redis.client.testEmit('end')
    redis.removeListener('RedisEnd', end)
    expect(end).toHaveBeenCalled()
    done()
  })
  test('subscriber ready event should emit', (done) => {
    const ready = jest.fn()
    pubsub.on('RedisSubscriberReady', ready)
    pubsub.subscriber.testEmit('ready')
    pubsub.removeListener('RedisSubscriberReady', ready)
    expect(ready).toHaveBeenCalled()
    done()
  })
  test('suscriber error event should emit', (done) => {
    const error = jest.fn()
    pubsub.on('RedisSubscriberError', error)
    pubsub.subscriber.testEmit('error', new Error())
    pubsub.removeListener('RedisSubscriberError', error)
    expect(error).toHaveBeenCalled()
    done()
  })
  test('subscriber end event should emit', (done) => {
    const end = jest.fn()
    pubsub.on('RedisSubscriberEnd', end)
    pubsub.subscriber.testEmit('end')
    pubsub.removeListener('RedisSubscriberEnd', end)
    expect(end).toHaveBeenCalled()
    done()
  })
})
