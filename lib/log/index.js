module.exports = {
  // this function will simply check if the log instance is valid
  // and contains the minimum required methods
  isValid: (log) => {
    return log && typeof log.out === 'function' && typeof log.debug === 'function' && typeof log.error === 'function'
  },

  // standard output
  Standard: require('./standard'),

  // no output
  Empty: require('./empty'),

  // error only
  ErrorOnly: require('./erroronly')
}
