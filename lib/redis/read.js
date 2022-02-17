const common = require('@kelchy/common')
const utils = require('./utils')

class Read {
  constructor (client, options = {}) {
    // requires a redis client
    if (!client) throw new Error('REDIS_READ_CLIENT_ERROR')
    this.client = client
  }

  // get the remaining ttl of key before it expires
  async ttl (key) {
    return read(this.client, [['ttl', key]])
  }

  // get the list of keys matching a certain pattern
  // TODO: convert this to non-blocking
  async keys (wildcard) {
    return read(this.client, [['keys', wildcard]])
  }

  // get value of the key
  async get (key) {
    return read(this.client, [['get', key]])
  }

  // get values of multiple keys
  async mget (keys, options = {}) {
    if (!options.batch) {
      keys.unshift('mget')
      return read(this.client, [keys])
    }
    // ideally, we should rely on ioredis mget, but in cases where we use a cluster, and we
    // get this error, "Error: All the keys in a pipeline command should belong to the same slot"
    // breaking it up into several get in a pipeline can work as an alternative
    const result = []
    // deepcopy to avoid causing issues from caller
    const copy = common.deepCopy(keys)
    while (copy.length) {
      const batch = []
      const group = copy.splice(0, options.batch)
      group.forEach(key => {
        batch.push(['get', key])
      })
      const { data, error } = await common.awaitWrap(this.client.pipeline(batch).exec())
      if (error) throw error
      // if not equal, we cannot assure the key value mapping
      if (batch.length !== data.length) throw new Error('REDIS_ERROR_INCONSISTENT')
      data.forEach(res => {
        // ioredis always return an array
        if (!res || !common.isArray(res)) throw new Error('REDIS_ERROR_INCONSISTENT')
        // first element is error, should always be null
        if (res[0]) throw new Error(`REDIS_ERROR ${res[0]}`)
        // second element is the result
        result.push(res[1])
      })
    }
    return result
  }

  // get all values associated with hash key
  async hgetall (key) {
    return read(this.client, [['hgetall', key]])
  }

  // get specified elements of the list stored at key
  async lrange (key, lmin, lmax, options = {}) {
    const ops = [['lrange', key, lmin, lmax]]
    if (options.ttl) ops.push(['expire', key, options.ttl])
    return read(this.client, ops, options)
  }

  // get all the members of the set value stored at key
  async smembers (key) {
    const ops = [['smembers', key]]
    return read(this.client, ops)
  }
}

// send to pipeline and automatically parses the response for the last result
async function read (client, arr, options = {}) {
  const { data, error } = await common.awaitWrap(client.pipeline(arr).exec(), { timeout: 1000 })
  if (error) throw error
  if (options.ttl) data.length = data.length - 1
  return utils.result(data)
}

module.exports = Read
