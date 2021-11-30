module.exports = {
  // this function will simply check if the log instance is valid
  // and contains the minimum required methods
  isValid: (log) => {
    return log && log.out && log.debug && log.error
  },

  // standard output
  Standard: require('./standard'),

  // no output
  Empty: require('./empty'),

  // error only
  ErrorOnly: require('./erroronly')
}
