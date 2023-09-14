const cors = require('cors')

class Cors {
  /**
   * Middleware to check for whitelist and allow API methods.
   */
  static cors (url, domain) {
    const corsOptions = {
      origin: function (origin, callback) {
        if (!origin) {
          callback(null)
        } else if (url.indexOf(origin) !== -1) {
          callback(null, true)
        } else {
          for (const d of domain) {
            if (origin.endsWith(d)) {
              return callback(null, true)
            }
          }
          callback(null)
        }
      },
      credentials: true,
      allowedHeaders: [
        'X-Request-Id',
        'Accept',
        'Authorization',
        'Content-Type',
        'X-CSRF-Token',
        'sentry-trace',
        'baggage'
      ],
      exposedHeaders: ['link']
    }
    return cors(corsOptions)
  }
}

module.exports = Cors
