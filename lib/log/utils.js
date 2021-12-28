const common = require('@kelchy/common')

class Utils {
  // this function will deliver the log to the intended output channel
  static output (channel, dateFormat, scope, msg, options) {
    const json = !options.json
      ? undefined
      : scope && !msg && common.isObject(scope)
        ? scope
        : scope && common.isObject(msg) && !msg.scope
          ? Object.assign({ scope }, msg)
          : { scope, msg }
    if (dateFormat) {
      if (!json) return console[channel](getDatetime(dateFormat, options.datetime), scope, msg)
      json.ts = getDatetime(dateFormat, options.datetime)
      console[channel](JSON.stringify(json))
    } else {
      if (!json) return console[channel](scope, msg)
      console[channel](JSON.stringify(json))
    }
  }
}

// this function will take the format and optionally the log datetime
// if no log datetime provided, it uses current one
function getDatetime (format, datetime) {
  const dt = datetime ? new Date(datetime) : new Date()
  if (format === 'iso') return dt.toISOString()
  else if (format === 'epoch') return dt.getTime().toString()
  // default
  return dt.toISOString()
}

module.exports = Utils
