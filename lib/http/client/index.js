const Log = require('@kelchy/log')
const Method = require('./method')

// TIMEOUT - default timeout
const TIMEOUT = 30000

class Http extends Method {
  constructor (option = {}) {
    // if application developer initializes its own logger
    // and pass it to the constructor i.e. they need logging to stdout
    // it should have 3 functions out, debug and error, if not, do nothing
    const log = Log.isValid(option.log) ? option.log : new Log.Empty()

    const { timeout } = option
    super({ log, timeout })

    this.log = log
    this.timeout = timeout || TIMEOUT
  }
}

module.exports = Http
