const rateLimit = require('express-rate-limit')

// Default configuration
const defaultConfig = {
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 480 // limit each IP to 480 requests per windowMs (8 requests per second)
  // message: log('out',""),
  // handler: ()=> {}
}

// Create default rate limiter instance
let defaultRateLimiter = null

class Ratelimit {
  static create (config = {}) {
    const mergedConfig = { ...defaultConfig, ...config }
    return rateLimit(mergedConfig)
  }

  static ratelimit (req, res, next) {
    // Use default rate limiter if not created yet
    if (!defaultRateLimiter) {
      defaultRateLimiter = rateLimit(defaultConfig)
    }
    return defaultRateLimiter(req, res, next)
  }
}

module.exports = Ratelimit
module.exports.ratelimit = Ratelimit.ratelimit
