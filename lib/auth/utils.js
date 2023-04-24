const axios = require('axios')
const common = require('@kelchy/common')

class Utils {
  // wrapper to handle outbound http requests using promises
  // google will fail if body/form is sent when it is not needed so payload should not have default value
  // application developer should be careful, if it is form encoded, pass { form: true } in options
  static async http (url, method, payload, options) {
    if (!options) options = {}
    if (!options.headers) options.headers = {}
    if (options.form) {
      // i.e. in some APIs, freeIPA expects form urlencoded
      options.headers = Object.assign(options.headers, { 'Content-Type': 'application/x-www-form-urlencoded' })
      delete options.form
    }
    const { data, error } = await common.awaitWrap(axios[method.toLowerCase()](url, payload, options))
    if (error) throw error
    return data
  }
}

module.exports = Utils
