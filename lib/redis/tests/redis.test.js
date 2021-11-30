const Log = require('@kelchy/log')
const Redis = require('../index')
const Read = require('../read')
const Write = require('../write')
const Pubsub = require('../pubsub')
const Methods = require('../methods')
const utils = require('../utils')

jest.mock('ioredis', () => require('ioredis-mock/jest'))
const REDIS_URI = 'redis://host:6327'
const redis = new Redis(REDIS_URI, { cluster: false })
const pubsub = new Redis(REDIS_URI, { redisOptions: Redis.clientOptions(false), pubsub: true, log: new Log.Empty() })

afterAll(() => {
  redis.quit()
  pubsub.quit()
})

describe('redis tests', () => {
  test('constructor should return client', (done) => {
    expect(redis).toHaveProperty('name')
    expect(redis).toHaveProperty('log')
    expect(redis).toHaveProperty('client')
    expect(pubsub).toHaveProperty('name')
    expect(pubsub).toHaveProperty('log')
    expect(pubsub).toHaveProperty('client')
    expect(pubsub).toHaveProperty('subscriber')
    expect(new Write(redis.client)).toHaveProperty('log')
    expect(new Methods(redis.client)).toHaveProperty('lock')
    expect(new Pubsub(pubsub.subscriber, pubsub.client)).toHaveProperty('log')
    try { new Pubsub(null, pubsub.client) } catch (e) { expect(e).toEqual(new Error('REDIS_PUBSUB_SUBSCRIBER_ERROR')) } // eslint-disable-line
    try { new Pubsub(pubsub.subscriber, null) } catch (e) { expect(e).toEqual(new Error('REDIS_PUBSUB_CLIENT_ERROR')) } // eslint-disable-line
    done()
  })
  test('ttl should return number', async (done) => {
    const ttl = await redis.ttl('fakekey')
    expect(typeof ttl).toEqual('number')
    done()
  })
  test('keys should return array', async (done) => {
    const keys = await redis.keys('fakekey')
    expect(Array.isArray(keys)).toBe(true)
    done()
  })
  test('key operations - set, mset, incr. get should return string', async (done) => {
    await redis.mset({ fakekey1: '456', fakekey2: '789' }, { ttl: 5 })
    await redis.mset({ fakekey: '012' })
    await redis.incr('fakekey1', { ttl: 5 })
    await redis.incr('fakekey1')
    let value = await redis.get('fakekey1')
    expect(value).toEqual('458')
    await redis.set('fakekey', '321')
    await redis.set('fakekey', '123', { xx: true })
    value = await redis.get('fakekey')
    await redis.del('fakekey')
    expect(value).toEqual('123')
    done()
  })
  test('set stringified json get json', async (done) => {
    await redis.set('fakekey', '{"abc":123}')
    const value = await redis.get('fakekey')
    await redis.del('fakekey')
    expect(value).toEqual({ abc: 123 })
    done()
  })
  test('set integer should get string', async (done) => {
    await redis.set('fakekey', 123)
    const value = await redis.get('fakekey')
    await redis.del('fakekey')
    expect(value).toEqual('123')
    done()
  })
  test('hash operations - hset, hmset, hincrby and hdel. hgetall should return object', async (done) => {
    await redis.hmset('fakehash', { fakehkey1: '456', fakehkey2: '789' }, { ttl: 5 })
    await redis.hmset('fakehash', { fakehkey: '012' })
    await redis.hdel('fakehash', 'fakehkey1')
    await redis.hset('fakehash', 'fakehkey', '321')
    await redis.hset('fakehash', 'fakehkey', '123', { ttl: 5 })
    await redis.hincrby('fakehash', 'fakehkey', 1, { ttl: 5 })
    await redis.hincrby('fakehash', 'fakehkey', 1)
    const value = await redis.hgetall('fakehash')
    await redis.del('fakehash')
    expect(value).toEqual({ fakehkey: '125', fakehkey2: '789' })
    done()
  })
  test('lock and unlock shoul return OK or null', async (done) => {
    let lock = await redis.lock('fakekey', 5, { value: { abc: 123 } })
    expect(lock).toEqual('OK')
    lock = await redis.lock('fakekey', 5, { value: { abc: 123 } })
    expect(lock).toEqual(null)
    const unlock = await redis.unlock('fakekey')
    expect(Array.isArray(unlock)).toBe(true)
    lock = await redis.lock('fakekey', 5, { value: 'stringvalue' })
    expect(lock).toEqual('OK')
    done()
  })
  test('list operations - rpush, lrem. lrange should return array', async (done) => {
    await redis.rpush('fakelist', ['fakeitem1', 'fakeitem2'], { ttl: 5 })
    await redis.rpush('fakelist', ['fakeitem1'])
    await redis.lrem('fakelist', -2, 'fakeitem1')
    const listttl = await redis.lrange('fakelist', 0, -1, { ttl: 5 })
    const list = await redis.lrange('fakelist', 0, -1)
    await redis.del('fakelist')
    expect(listttl).toEqual(['fakeitem2'])
    expect(list).toEqual(['fakeitem2'])
    done()
  })
  test('sorted list operations - sadd. smembers shoul return array', async (done) => {
    await redis.sadd('fakelist', ['fakeitem1'], { ttl: 5 })
    await redis.sadd('fakelist', ['fakeitem2'])
    const list = await redis.smembers('fakelist')
    await redis.del('fakelist')
    expect(list).toEqual(['fakeitem1', 'fakeitem2'])
    done()
  })
  test('utils result should return last result on redis response array', (done) => {
    expect(utils.result()).toEqual(undefined)
    expect(utils.result([null])).toEqual(undefined)
    expect(utils.result([[null, '{"abc":123}']])).toEqual({ abc: 123 })
    done()
  })
  test('pubsub - subscriber should receive message from publisher', async (done) => {
    pubsub.subscribe('fakechan')
    pubsub.on('fakechan', (msg) => {
      expect(msg).toEqual('fakemsg')
      done()
    })
    // this will work for real redis servers
    pubsub.publish('fakechan', 'fakemsg')
    // this will work for ioredis-mock
    const testPublisher = pubsub.subscriber.createConnectedClient()
    testPublisher.publish('fakechan', 'fakemsg')
  })
  test('read - empty client should return error', (done) => {
    try { new Read() } catch (e) { expect(e).toEqual(new Error('REDIS_READ_CLIENT_ERROR')) } // eslint-disable-line
    done()
  })
  test('write - empty client should return error', (done) => {
    try { new Write() } catch (e) { expect(e).toEqual(new Error('REDIS_WRITE_CLIENT_ERROR')) } // eslint-disable-line
    done()
  })
  test('lock missing/invalid parameter should return error', (done) => {
    expect(redis.lock()).rejects.toEqual(new Error('REDIS_LOCK_KEY_TTL_INVALID'))
    done()
  })
  test('sadd missing/invalid parameter should return error', (done) => {
    expect(redis.sadd()).rejects.toEqual(new Error('REDIS_SADD_LIST_INVALID'))
    done()
  })
  test('rpush missing/invalid parameter should return error', (done) => {
    expect(redis.rpush()).rejects.toEqual(new Error('REDIS_RPUSH_LIST_INVALID'))
    done()
  })
  test('should be able to handle pipeline errors', async (done) => {
    redis.set = jest.fn(async () => { throw new Error() })
    expect(redis.lock('fakekey', 5)).rejects.toEqual(new Error())
    redis.set = jest.fn(async () => { return null })
    expect(await redis.lock('fakekey', 5)).toEqual(null)
    const client = redis.client
    redis.client.pipeline = jest.fn(() => { return { exec: async () => { throw new Error() } } })
    expect(redis.get('fakekey_pipeline')).rejects.toEqual(new Error())
    redis.client = client
    done()
  })
})
