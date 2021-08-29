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
    const log = Log.isValid(options.log) ? options.log : new Log.Empty()

    super()
    // TODO: enforce params like poolsize, socketTimeoutMS, readPreference
    const client = new MongoClient(uri)
    client.connect().then(() => {
      client.db(db).command({ ping: 1 }).then(() => {
        this.emit('MongoReady')
      }).catch(e => log.error('MONGO_INIT_DB', e))
    }).catch(e => log.error('MONGO_INIT_CONNECT', e))

    this.client = client
    this.db = client.db(db)
    this.readPreference = options.readPreference || mongoDb.ReadPreference.SECONDARY_PREFERRED
    this.log = log
  }

  // get admin db for admin level operations
  admin () {
    return this.client.db().admin()
  }

  find (collection, query, options = {}) {
    options.readPreference = options.readPreference || this.readPreference
    return mongoQuery(this.db.collection(collection), 'find', query, null, options).toArray()
  }

  aggregate (collection, query, options = {}) {
    options.readPreference = options.readPreference || this.readPreference
    return mongoQuery(this.db.collection(collection), 'aggregate', query, null, options).toArray()
  }

  insert (collection, query, options) {
    const method = common.isArray(query) ? 'insertMany' : 'insertOne'
    return mongoQuery(this.db.collection(collection), method, query, null, options)
  }

  update (collection, query, operation, options) {
    const method = common.isArray(query) ? 'updateMany' : 'updateOne'
    return mongoQuery(this.db.collection(collection), method, query, operation, options)
  }
}

function mongoQuery (collection, method, query, operation, options) {
  if (!collection || !query) throw new Error('Invalid params - missing collection or query')
  if (operation) return collection[method](query, operation, options)
  else return collection[method](query, options)
}

module.exports = Mongo
