const Methods = require('./methods')
const utils = require('./utils')

class Standard extends Methods {
  constructor (options = {}) {
    super(options)
    this.type = 'standard'
    // defaults
    this.debugging = options.debugging || false
    this.dateFormat = options.dateFormat || 'iso'
    this.json = true
    if (options.json === false) this.json = false
  }

  out (scope, msg, options = {}) {
    if (this.json) options.json = true
    utils.output('log', this.dateFormat, scope, msg, options)
  }

  debug (scope, msg, options = {}) {
    if (this.json) options.json = true
    if (this.debugging) utils.output('debug', this.dateFormat, scope, msg, options)
  }

  error (scope, msg, options = {}) {
    if (this.json) options.json = true
    if (msg instanceof Error) {
      options.stack = JSON.stringify(msg.stack)
      msg = msg.message
    }
    utils.output('error', this.dateFormat, scope, msg, options)
  }
}

module.exports = Standard
