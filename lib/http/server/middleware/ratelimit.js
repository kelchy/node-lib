const rateLimit = require('express-rate-limit')

class Ratelimit {
  static ratelimit (req, res, next) {
    return rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 120 // limit each IP to 2 requests per windowMs
      // message: log('out',""),
      // handler: ()=> {}
    })(req, res, next)
  }
}

module.exports = Ratelimit
