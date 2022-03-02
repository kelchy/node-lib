const EventEmitter = require('events').EventEmitter
const Read = require('./read')
const Write = require('./write')
const Pubsub = require('./pubsub')

// extended from Redis - or else client, subscriber will be undefined
class Methods extends EventEmitter {
  // constructor will be initialized by super() in the parent
  // WARNING: methods not exposed here will be unavailable in the parent class
  constructor (client, options = {}) {
    super()
    const { subscriber, log } = options
    this.log = log
    this.client = client
    this.subscriber = subscriber

    // read methods
    const read = new Read(client)
    this.ttl = read.ttl
    this.keys = read.keys
    this.get = read.get
    this.mget = read.mget
    this.hgetall = read.hgetall
    this.lrange = read.lrange
    this.smembers = read.smembers

    if (subscriber) {
      // pubsub methods
      const pubsub = new Pubsub(subscriber, client, { log })
      this.subscribe = pubsub.subscribe
      this.publish = pubsub.publish
    }

    // write methods
    const write = new Write(client, { log })
    this.lock = write.lock
    this.unlock = write.unlock
    this.set = write.set
    this.del = write.del
    this.hset = write.hset
    this.hdel = write.hdel
    this.hmset = write.hmset
    this.mset = write.mset
    this.incr = write.incr
    this.hincrby = write.hincrby
    this.rpush = write.rpush
    this.lrem = write.lrem
    this.sadd = write.sadd
  }
}

module.exports = Methods
