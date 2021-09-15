const Ioredis = require('ioredis')
const Log = require('@kelchy/log')
const methods = require('./methods')
const utils = require('./utils')

class Redis extends methods {
  // note: this constructor does not support sentinel nor multiple redis db
  // if multiple db is required, application developer needs to initialize
  // a redis client for each and every db
  //
  // supported options:
  // name - to identify the client if the application requires multiple clients
  // pubsub - to enable pubsub ability
  // log - the logger object which is initialized from the log module
  constructor (redisuri, options = {}) {
    // if application developer initializes its own logger
    // and pass it to the constructor i.e. they need logging to stdout
    // it should have 3 functions out, debug and error, if not, do nothing
    const log = Log.isValid(options.log) ? options.log : new Log.Empty()

    let client
    let subscriber

    // cluster enabled by default unless disabled
    if (options.cluster === false) {
      client = new Ioredis(redisuri, {})
      // optional pubsub which application developer needs to explicitly enable
      subscriber = options.pubsub ? new Ioredis(redisuri, {}) : undefined
    } else {
      const url = new URL(redisuri)
      // check if the constructor was provided redisOptions
      if (!options.redisOptions) options.redisOptions = Redis.clientOptions(url.password)
      const nodes = [{ host: url.hostname, port: url.port }]
      client = new Ioredis.Cluster(nodes, options.redisOptions)
      subscriber = options.pubsub ? new Ioredis.Cluster(nodes, options.redisOptions) : undefined
    }

    // super() will expose parent properties and functions
    // required on class extends
    super(client, { subscriber, log })

    this.name = options.name || ''
    this.log = log
    this.client = client
    this.subscriber = subscriber

    // application might want to wait for RedisReady event before proceeding
    client.on('ready', () => {
      log.debug('RedisReady')
      this.emit('RedisReady')
    })

    // we don't want to throw errors everytime as we want to retry connections
    // instead of erroring out but application developer needs to know when this happens
    client.on('error', (err) => {
      log.error('RedisError', err)
      this.emit('RedisError', err.message)
    })
    client.on('end', () => {
      log.error('RedisEnd')
      this.emit('RedisEnd')
    })

    if (options.pubsub) {
      // application might want to wait for RedisSubscriberReady event before proceeding
      subscriber.on('ready', () => {
        log.debug('RedisSubscriberReady')
        this.emit('RedisSubscriberReady')
      })

      // we don't want to throw errors everytime as we want to retry connections
      // instead of erroring out but application developer needs to know when this happens
      subscriber.on('error', (err) => {
        log.error('RedisSubscriberError', err)
        this.emit('RedisSubscriberError', err.message)
      })
      subscriber.on('end', () => {
        log.error('RedisSubscriberEnd')
        this.emit('RedisSubscriberEnd')
      })

      // send published messages to subscribers through internal emitter so application developers
      // will not be required to listen directly to the exposed subscriber client
      subscriber.on('message', (chan, msg) => {
        log.debug(`Publish ${chan}`, msg)
        this.emit(chan, msg)
      })
    }
  }

  quit () {
    // cleanup logic, clear all clients
    this.client.quit()
    if (this.subscriber) {
      this.subscriber.quit()
    }
  }
}

Redis.clientOptions = utils.clientOptions
Redis.result = utils.result

module.exports = Redis
