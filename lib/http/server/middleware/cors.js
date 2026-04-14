const cors = require('cors')

class Cors {
  /** Allow requests whose Origin is in `url` or whose URL ends with a `domain` suffix. */
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
        'baggage',
        // Session retry: lets the browser send a refresh token on credentialed cross-origin requests when access/session auth has expired (not only via HttpOnly cookie).
        'refresh',
        'x-refresh-token'
      ],
      // Expose so client JS can read a rotated refresh token from the response during the same retry flow.
      exposedHeaders: ['link', 'refresh', 'x-refresh-token']
    }
    return cors(corsOptions)
  }
}

module.exports = Cors
