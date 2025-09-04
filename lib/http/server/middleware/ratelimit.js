const rateLimit = require('express-rate-limit')

class Ratelimit {
  static ratelimit (max = 120) {
    const options = {
      windowMs: 1 * 60 * 1000, // 1 minute
      max: max, // use the number as max, default 120
      // message: log('out',""),
      // handler: ()=> {}
      standardHeaders: true,
      legacyHeaders: false
    }

    return rateLimit(options)
  }
}

module.exports = Ratelimit
