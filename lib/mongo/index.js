const mongoDb = require('mongodb')
const EventEmitter = require('events').EventEmitter
const common = require('@kelchy/common')
const Log = require('@kelchy/log')

const MongoClient = mongoDb.MongoClient

class Mongo extends EventEmitter {
  constructor (uri, options = {}) {
    // if application developer initializes its own logger
    // and pass it to the constructor i.e. they need logging to stdout
    // it should have 3 functions out, debug and error, if not, do nothing
    const log = Log.isValid(options.log) ? options.log : new Log.ErrorOnly()

    if (!uri) throw new Error('MONGO_PARAMS_EMPTY')
    const url = new URL(uri)
    // if the uri is invalid, new URL will throw, no need to check if url exists
    if (!url.hostname || !url.pathname) throw new Error('MONGO_PARAMS_INVALID')
    // remove the leading slash from pathname, path is the database name
    const db = url.pathname.replace('/', '')

    super()

    // TODO: enforce params like poolsize, socketTimeoutMS, readPreference
    const client = new MongoClient(uri, options.clientOptions)
    client.connect().then(() => {
      // this will not test whether the database exists or permissions alright
      // this merely tests whether the client is connected to the cluster
      client.db(db).command({ ping: 1 }).then(r => {
        this.db = client.db(db)
        this.emit('MongoReady')
        // mongodb ttl minimum is 60 seconds and there is no guarantee that it is accurate
        if (options.lockEnable) {
          this.lockEnable = true
          this.db.createIndex('locks', { lockTime: 1 }, {
            expireAfterSeconds: options.ttl || 60
          }).catch(e => log.error('MONGO_INIT_LOCK', e))
        }
      }).catch(e => log.error('MONGO_INIT_DB', e))
    }).catch(e => log.error('MONGO_INIT_CONNECT', e))

    this.client = client
    // if readPreference was not provided as an option, we default to SECONDARY_PREFERRED
    // this will be referenced by methods in this class when reading from collections
    this.readPreference = options.readPreference || mongoDb.ReadPreference.SECONDARY_PREFERRED
    this.log = log
  }

  static readPreference () {
    return mongoDb.ReadPreference
  }

  static objectId (id) {
    return new mongoDb.ObjectId(id)
  }

  database (db) {
    this.db = this.client.db(db)
    return this.db
  }

  // get admin db for admin level operations
  admin () {
    return this.client.db().admin()
  }

  async createCollection (name, options = {}) {
    return this.db.createCollection(name, { validator: options.validator })
  }

  async showCollections () {
    const { data, error } = await common.awaitWrap(this.db.listCollections({}, { nameOnly: true }).toArray())
    if (error) throw error
    return data.map(o => { return o.name })
  }

  async find (collection, query, options = {}) {
    const col = this.db.collection(collection)
    if (!col || !query) throw new Error('MONGO_FIND_PARAMS')
    options.readPreference = options.readPreference || this.readPreference
    return mongoQuery(col, 'find', query, null, options).toArray()
  }

  async aggregate (collection, query, options = {}) {
    const col = this.db.collection(collection)
    if (!col || !query) throw new Error('MONGO_AGGREGATE_PARAMS')
    options.readPreference = options.readPreference || this.readPreference
    return mongoQuery(col, 'aggregate', query, null, options).toArray()
  }

  async insert (collection, query, options) {
    const col = this.db.collection(collection)
    if (!col || !query) throw new Error('MONGO_INSERT_PARAMS')
    const method = common.isArray(query) ? 'insertMany' : 'insertOne'
    return mongoQuery(col, method, query, null, options)
  }

  async update (collection, query, operation, options = {}) {
    const col = this.db.collection(collection)
    if (!col || !query || !operation) throw new Error('MONGO_UPDATE_PARAMS')
    const method = options.many ? 'updateMany' : 'updateOne'
    return mongoQuery(col, method, query, operation, options)
  }

  async delete (collection, query, options = {}) {
    const col = this.db.collection(collection)
    if (!col || !query) throw new Error('MONGO_DELETE_PARAMS')
    const method = options.many ? 'deleteMany' : 'deleteOne'
    return mongoQuery(col, method, query, null, options)
  }

  async lock (key, options = {}) {
    if (!this.lockEnable) throw new Error('MONGO_LOCK_DISABLED')
    // ttl in mongo is associated with the index, set it when initializing
    if (!key) throw new Error('MONGO_LOCK_KEY_INVALID')
    // insert with a unique _id
    const { data, error } = await common.awaitWrap(this.insert('locks', {
      _id: key,
      value: options.value,
      lockTime: new Date()
    }), { timeout: 1000 })
    if (error) {
      // do not throw if duplicate key, this means something else locked it before
      if (error.message.substring(0, 26) === 'E11000 duplicate key error') return false
      throw error
    }
    // mongo returns the insertedId if successful, meaning it did not exist before
    if (data.insertedId === key) return true
    // throw if the insertedId is not the same as key, something unexpected may have happened
    else throw new Error('MONGO_LOCK_ANOMALY')
  }

  async unlock (key, options = {}) {
    if (!this.lockEnable) throw new Error('MONGO_LOCK_DISABLED')
    if (!key) throw new Error('MONGO_UNLOCK_KEY_INVALID')
    // to unlock, just delete the key
    return this.delete('locks', { _id: key }, options)
  }
}

function mongoQuery (collection, method, query, operation, options) {
  if (operation) return collection[method](query, operation, options)
  else return collection[method](query, options)
}

module.exports = Mongo
