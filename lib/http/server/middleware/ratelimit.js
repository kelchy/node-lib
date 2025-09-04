const rateLimit = require('express-rate-limit')

class Ratelimit {
  static ratelimit (max = 120) {
    const options = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: max, // use the number as max, default 120
      message: {
        error: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          error: 'Too many requests from this IP, please try again later.'
        })
      }
    }

    return rateLimit(options)
  }
}

module.exports = Ratelimit
