const Mongo = require('../index')
const Log = require('@kelchy/log')
const uri = 'mongodb+srv://user:pass@host/db?option=value'
const mongo = new Mongo(uri)
const mngl = new Mongo(uri, { lockEnable: true })

jest.spyOn(console, 'error').mockImplementation()

jest.mock('mongodb', () => {
  const EventEmitter = require('events').EventEmitter
  return {
    MongoClient: class extends EventEmitter {
      constructor (uri, options) {
        super()
        this.connect = async () => {
          if (options === 'connecterror') throw new Error('error')
        }
        this.db = (db) => {
          const methods = {
            find: (query) => { return { toArray: async () => { return [{}] } } },
            aggregate: (query) => { return { toArray: async () => { return [{}] } } },
            insertOne: jest.fn().mockResolvedValue({}),
            insertMany: jest.fn().mockResolvedValue({}),
            updateOne: jest.fn().mockResolvedValue({}),
            updateMany: jest.fn().mockResolvedValue({}),
            deleteOne: jest.fn().mockResolvedValue({}),
            deleteMany: jest.fn().mockResolvedValue({})
          }
          return {
            admin: () => { return { serverStatus: async () => { return {} } } },
            createCollection: jest.fn(),
            createIndex: async (collection, index, options) => { if (options.expireAfterSeconds > 60) throw new Error('error') },
            databaseName: db,
            command: async () => { if (options === 'error') throw new Error('error') },
            listCollections: () => {
              return {
                toArray: async () => {
                  if (options === 'listerror') throw new Error('error')
                  return [{ name: 'a' }, { name: 'b' }, { name: 'c' }]
                }
              }
            },
            collection: (collectionName) => {
              if (collectionName === 'unknown') return undefined
              return methods
            }
          }
        }
      }
    },
    ReadPreference: { SECONDARY_PREFERRED: 'secondaryPreferred' },
    ObjectId: jest.fn()
  }
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('mongo tests', () => {
  test('constructor error should not have valid client', (done) => {
    try { new Mongo() } catch (e) { expect(e).toEqual(new Error('MONGO_PARAMS_EMPTY')) } //eslint-disable-line
    try { new Mongo('') } catch (e) { expect(e).toEqual(new Error('MONGO_PARAMS_EMPTY')) } //eslint-disable-line
    try { new Mongo('uri://') } catch (e) { expect(e).toEqual(new Error('MONGO_PARAMS_INVALID')) } //eslint-disable-line
    try { new Mongo('uri://', {}) } catch (e) { expect(e).toEqual(new Error('MONGO_PARAMS_INVALID')) } //eslint-disable-line
    try { new Mongo(uri, { lockEnable: true, ttl: 120 }) } catch (e) { expect(e).toEqual(new Error('MONGO_INIT_LOCK')) } //eslint-disable-line
    done()
  })
  test('constructor uri error should log error', (done) => {
    const log = new Log.Standard()
    const mng = new Mongo(uri, { log, clientOptions: 'connecterror' })
    setTimeout(() => {
      expect(mng.log).toEqual(log)
      expect(console.error).toHaveBeenCalledTimes(1)
      done()
    }, 10)
  })
  test('constructor db error should log error', (done) => {
    const log = new Log.Standard()
    const mng = new Mongo(uri, { log, clientOptions: 'error' })
    setTimeout(() => {
      expect(mng.log).toEqual(log)
      expect(console.error).toHaveBeenCalledTimes(1)
      done()
    }, 10)
  })
  test('constructor ready should emit', (done) => {
    const trigger = jest.fn()
    const mng = new Mongo(uri)
    mng.on('MongoReady', trigger)
    setTimeout(() => {
      expect(trigger).toHaveBeenCalledTimes(1)
      done()
    }, 10)
  })
  test('database function should change db', (done) => {
    const db = mongo.database('new')
    expect(db.databaseName).toEqual('new')
    expect(mongo.db.databaseName).toEqual('new')
    done()
  })
  test('admin function should return admin instance', (done) => {
    const admin = mongo.admin()
    expect(admin.serverStatus()).resolves.toEqual({})
    done()
  })
  test('createCollection function should call mongo createCollection', async () => {
    await mongo.createCollection('name', { validator: {} })
    expect(mongo.db.createCollection).toHaveBeenLastCalledWith('name', { validator: {} })
    await mongo.createCollection('name')
    expect(mongo.db.createCollection).toHaveBeenLastCalledWith('name', { validator: undefined })
  })
  test('showCollections error should throw', (done) => {
    const mng = new Mongo(uri, { clientOptions: 'listerror' })
    setTimeout(async () => {
      expect(mng.showCollections()).rejects.toEqual(new Error('error'))
      done()
    }, 10)
  })
  test('showCollections function should return array of strings', (done) => {
    expect(mongo.showCollections()).resolves.toEqual(['a', 'b', 'c'])
    done()
  })
  test('unknown collection should throw', (done) => {
    expect(mongo.find('unknown', { a: 1 })).rejects.toEqual(new Error('MONGO_FIND_PARAMS'))
    expect(mongo.aggregate('unknown', [{ a: 1 }])).rejects.toEqual(new Error('MONGO_AGGREGATE_PARAMS'))
    expect(mongo.insert('unknown', { a: 1 })).rejects.toEqual(new Error('MONGO_INSERT_PARAMS'))
    expect(mongo.update('unknown', { a: 1 }, { b: 2 })).rejects.toEqual(new Error('MONGO_UPDATE_PARAMS'))
    done()
  })
  test('find function should return array of objects', (done) => {
    expect(mongo.find('collection', { a: 1 })).resolves.toEqual([{}])
    done()
  })
  test('aggregate function should return array of objects', (done) => {
    expect(mongo.aggregate('collection', [{ a: 1 }])).resolves.toEqual([{}])
    done()
  })
  test('insert function should return object', (done) => {
    expect(mongo.insert('collection', { a: 1 })).resolves.toEqual({})
    expect(mongo.insert('collection', [{ a: 1 }])).resolves.toEqual({})
    done()
  })
  test('update function should return object', (done) => {
    mongo.client.db('db').collection('collection').updateOne.mockResolvedValue({})
    expect(mongo.update('collection', { a: 1 }, { b: 2 })).resolves.toEqual({})
    expect(mongo.update('collection', { a: 1 }, { b: 2 }, { many: true })).resolves.toEqual({})
    done()
  })
  test('delete error should throw', async () => {
    expect(mongo.delete('collection')).rejects.toEqual(new Error('MONGO_DELETE_PARAMS'))
  })
  test('delete function should return object', (done) => {
    expect(mongo.delete('collection', {})).resolves.toEqual({})
    expect(mongo.delete('collection', {}, { many: true })).resolves.toEqual({})
    done()
  })
  test('readPreference should call module', (done) => {
    const o = Mongo.readPreference()
    expect(o.SECONDARY_PREFERRED).toEqual('secondaryPreferred')
    done()
  })
  test('objectId should call module', (done) => {
    const mng = require('mongodb')
    Mongo.objectId('id')
    expect(mng.ObjectId).toHaveBeenLastCalledWith('id')
    done()
  })
  test('lock should lock, unlock should unlock', async () => {
    // if lock is not enabled
    await expect(mongo.lock('test')).rejects.toEqual(new Error('MONGO_LOCK_DISABLED'))
    await expect(mongo.unlock('test')).rejects.toEqual(new Error('MONGO_LOCK_DISABLED'))
    // simulate a successful lock
    mngl.db.collection('locks').insertOne.mockResolvedValue({ insertedId: 'test' })
    await expect(mngl.lock('test')).resolves.toEqual(true)
    // simulate something locked it before
    mngl.db.collection('locks').insertOne.mockRejectedValue(new Error('E11000 duplicate key error'))
    await expect(mngl.lock('test')).resolves.toEqual(false)
    await mngl.unlock('test')
    // simulate a successful lock
    mngl.db.collection('locks').insertOne.mockResolvedValue({ insertedId: 'test' })
    await expect(mngl.lock('test')).resolves.toEqual(true)
    // simulate empty key should error
    await expect(mngl.lock('')).rejects.toEqual(new Error('MONGO_LOCK_KEY_INVALID'))
    await expect(mngl.lock(null)).rejects.toEqual(new Error('MONGO_LOCK_KEY_INVALID'))
    await expect(mngl.lock()).rejects.toEqual(new Error('MONGO_LOCK_KEY_INVALID'))
    await expect(mngl.unlock('')).rejects.toEqual(new Error('MONGO_UNLOCK_KEY_INVALID'))
    await expect(mngl.unlock(null)).rejects.toEqual(new Error('MONGO_UNLOCK_KEY_INVALID'))
    await expect(mngl.unlock()).rejects.toEqual(new Error('MONGO_UNLOCK_KEY_INVALID'))
    // simulate mongo error or anomaly should throw
    mngl.db.collection('locks').insertOne.mockResolvedValue({ insertedId: 'test1' })
    await expect(mngl.lock('test')).rejects.toEqual(new Error('MONGO_LOCK_ANOMALY'))
    mngl.db.collection('locks').insertOne.mockRejectedValue(new Error('error'))
    await expect(mngl.lock('test')).rejects.toEqual(new Error('error'))
  })
})
