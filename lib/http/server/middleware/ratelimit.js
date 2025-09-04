const rateLimit = require('express-rate-limit')

class Ratelimit {
  static ratelimit (max = 480) {
    const options = {
      windowMs: 1 * 60 * 1000, // 1 minute
      max: max, // use the number as max, default 480
      // message: log('out',""),
      // handler: ()=> {}
      standardHeaders: true,
      legacyHeaders: false
    }

    return rateLimit(options)
  }
}

module.exports = Ratelimit
