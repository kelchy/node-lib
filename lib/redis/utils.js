const common = require('@kelchy/common')

class Utils {
  // helper function to extract the result from an array of redis results from
  // the pipeline. since the pipeline is a 2 dimensional array, the result is also same
  // this helper assumes the last result is the one needed, if not, do not use this
  // and manually process the result
  static result (value) {
    if (!value || !common.isArray(value) || value.length < 1) return undefined
    const last = value.length - 1
    if (!value[last] || !common.isArray(value[last])) return undefined
    // check if json string
    // instead of parsing everything everytime, we try to detect the first character
    // instead since JSON always start with '{' and for this case, we will also accept
    // arrays which start with '['
    return value[last][1] && (value[last][1][0] === '{' || value[last][1][0] === '[')
      ? common.jsonSafe(value[last][1])
      : value[last][1]
  }

  static clientOptions (password) {
    return {
      // required for elasticache to work
      dnsLookup: (address, callback) => callback(null, address),
      redisOptions: {
        password,
        tls: {}
      }
    }
  }
}

module.exports = Utils
