const Log = require('@kelchy/log')
const common = require('@kelchy/common')
const axios = require('axios')

class Method {
  constructor (option = {}) {
    // if application developer initializes its own logger
    // and pass it to the constructor i.e. they need logging to stdout
    // it should have 3 functions out, debug and error, if not, do nothing
    const log = Log.isValid(option.log) ? option.log : new Log.Empty()

    const { timeout } = option

    this.log = log
    this.timeout = timeout
  }

  get (url, option = {}) {
    const { headers, timeout } = option
    return wrapper(
      axios({
        method: 'get',
        url,
        headers,
        timeout: timeout || this.timeout
      }), this.log
    )
  }

  post (url, data, option = {}) {
    const { headers, timeout } = option
    return wrapper(
      axios({
        method: 'post',
        url,
        data,
        headers,
        timeout: timeout || this.timeout
      }), this.log
    )
  }

  put (url, data, option = {}) {
    const { headers, timeout } = option
    return wrapper(
      axios({
        method: 'put',
        url,
        data,
        headers,
        timeout: timeout || this.timeout
      }), this.log
    )
  }

  delete (url, option = {}) {
    const { headers, timeout } = option
    return wrapper(
      axios({
        method: 'delete',
        url,
        headers,
        timeout: timeout || this.timeout
      }), this.log
    )
  }

  patch (url, data, option = {}) {
    const { headers, timeout } = option
    return wrapper(
      axios({
        method: 'patch',
        url,
        data,
        headers,
        timeout: timeout || this.timeout
      }), this.log
    )
  }
}

async function wrapper (pr, log) {
  const { data, error } = await common.awaitWrap(pr)
  if (error) {
    const { url, method, headers } = error.config
    log.debug('ERR_HTTP_CLIENT', { error: error.message, url, method, headers })
    throw error
  }
  return data.data
}

module.exports = Method
