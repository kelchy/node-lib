# Redis

## This module wraps helper functions around ioredis to simplify development 

- Requires
```
ioredis
```

- Basic Initialization - default client options, cluster support for AWS elasticache enabled
```
const Redis = require('@kelchy/redis')
const redis = new Redis(process.env.REDIS_URI)
```
- Custom client options - cluster support for AWS elasticache turned off
```
const redisOptions = Redis.clientOptions()
const redis = new Redis(process.env.REDIS_URI, { redisOptions })
```
- Use pubsub 
```
const redis = new Redis(process.env.REDIS_URI, { pubsub: true })
```
- Turn internal logging on
```
const Log = require('@kelchy/log')
const redis = new Redis(process.env.REDIS_URI, { redisOptions: Redis.clientOptions('password'), log: new Log.Standard() })
```

- supported methods
```
lock(key, ttl, options)
unlock(key, options)
set(key, value, options)
del(key)
hset(key, hkey, hvalue, options)
hdel(key, hkey)
hmset(key, obj, options)
mset(obj, options)
incr(key, options)
hincrby(key, hkey, hvalue, options)
rpush(key, list, options)
lrem(key, count, element, options)
sadd(key, list, options)

ttl(key)
keys(wildcard)
get(key)
hgetall(key)
lrange(key, lmin, lmax, options)
smembers(key)

subscribe(chan)
publish(chan, msg)

clientOptions(password) - returns client options which can be used during initialization - 'password' is string
result(value) - retrieves the last result from a write operation result - 'value'
```
