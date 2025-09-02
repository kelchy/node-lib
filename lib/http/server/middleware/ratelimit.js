const rateLimit = require('express-rate-limit')

// Create rate limiter instance once at module level
const rateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120 // limit each IP to 120 requests per windowMs
  // message: log('out',""),
  // handler: ()=> {}
});

class Ratelimit {
  static ratelimit (req, res, next) {
    return rateLimiter(req, res, next)
  }
}

module.exports = Ratelimit
