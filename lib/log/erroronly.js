const Methods = require('./methods')
const utils = require('./utils')

class ErrorOnly extends Methods {
  constructor (options = {}) {
    super(options)
    this.type = 'erroronly'

    // defaults
    this.debugging = false
    this.dateFormat = options.dateFormat || 'iso'
    this.json = true
    if (options.json === false) this.json = false
  }

  out (scope, msg, options = {}) {
    // nothing will happen
  }

  debug (scope, msg, options = {}) {
    // nothing will happen
  }

  error (scope, msg, options = {}) {
    if (this.json) options.json = true
    utils.output('error', this.dateFormat, scope, msg, options)
  }
}

module.exports = ErrorOnly
