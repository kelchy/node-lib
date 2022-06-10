const Mongo = require('../index')
const Log = require('@kelchy/log')

const mongo = new Mongo('uri', 'db')

jest.spyOn(console, 'error').mockImplementation()

jest.mock('mongodb', () => {
  const EventEmitter = require('events').EventEmitter
  return {
    MongoClient: class extends EventEmitter {
      constructor (uri, db) {
        super()
        this.connect = async () => {
          if (uri === 'error') throw new Error('error')
        }
        this.db = (db) => {
          return {
            admin: () => { return { serverStatus: async () => { return {} } } },
            createCollection: jest.fn(),
            databaseName: db,
            command: async () => { if (db === 'error') throw new Error('error') },
            listCollections: () => {
              return {
                toArray: async () => {
                  if (uri === 'urilisterror') throw new Error('error')
                  return [{ name: 'a' }, { name: 'b' }, { name: 'c' }]
                }
              }
            },
            collection: (collectionName) => {
              if (collectionName === 'unknown') return undefined
              return {
                find: (query) => { return { toArray: async () => { return [{}] } } },
                aggregate: (query) => { return { toArray: async () => { return [{}] } } },
                insertOne: async (query) => { return {} },
                insertMany: async (query) => { return {} },
                updateOne: async (query) => { return {} },
                updateMany: async (query) => { return {} },
                deleteOne: async (query) => { return {} },
                deleteMany: async (query) => { return {} }
              }
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
    try { new Mongo('test') } catch (e) { expect(e).toEqual(new Error('MONGO_PARAMS_EMPTY')) } //eslint-disable-line
    try { new Mongo('test', '') } catch (e) { expect(e).toEqual(new Error('MONGO_PARAMS_EMPTY')) } //eslint-disable-line
    done()
  })
  test('constructor uri error should log error', (done) => {
    const log = new Log.Standard()
    const mng = new Mongo('error', 'error', { log })
    setTimeout(() => {
      expect(mng.log).toEqual(log)
      expect(console.error).toHaveBeenCalledTimes(1)
      done()
    }, 10)
  })
  test('constructor db error should log error', (done) => {
    const log = new Log.Standard()
    const mng = new Mongo('uri', 'error', { log })
    setTimeout(() => {
      expect(mng.log).toEqual(log)
      expect(console.error).toHaveBeenCalledTimes(1)
      done()
    }, 10)
  })
  test('constructor ready should emit', (done) => {
    const trigger = jest.fn()
    const mng = new Mongo('uri', 'db')
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
    const mng = new Mongo('urilisterror', 'db')
    setTimeout(() => {
      expect(mng.showCollections('error')).rejects.toEqual(new Error('error'))
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
})
