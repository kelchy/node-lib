const mongoDb = require('mongodb')
const EventEmitter = require('events').EventEmitter
const common = require('@kelchy/common')
const Log = require('@kelchy/log')

const MongoClient = mongoDb.MongoClient

class Mongo extends EventEmitter {
  constructor (uri, db, options = {}) {
    // if application developer initializes its own logger
    // and pass it to the constructor i.e. they need logging to stdout
    // it should have 3 functions out, debug and error, if not, do nothing
    const log = Log.isValid(options.log) ? options.log : new Log.ErrorOnly()

    if (!uri || !db) throw new Error('MONGO_PARAMS_EMPTY')
    super()
    // TODO: enforce params like poolsize, socketTimeoutMS, readPreference
    const client = new MongoClient(uri)
    client.connect().then(() => {
      client.db(db).command({ ping: 1 }).then(() => {
        this.db = client.db(db)
        this.emit('MongoReady')
      }).catch(e => log.error('MONGO_INIT_DB', e))
    }).catch(e => log.error('MONGO_INIT_CONNECT', e))

    this.client = client
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
}

function mongoQuery (collection, method, query, operation, options) {
  if (operation) return collection[method](query, operation, options)
  else return collection[method](query, options)
}

module.exports = Mongo
