const Vonage = require('@vonage/server-sdk')
const Log = require('@kelchy/log')

class Nexmo {
  constructor (apiKey, apiSecret, from, options = {}) {
    if (!apiKey || !apiSecret || !from) {
      throw new Error('NEXMO_CREDENTIALS_EMPTY')
    }
    // "from" can be overriden by nexmo
    this.from = from
    this.client = new Vonage({
      apiKey,
      apiSecret
    }, {
      timeout: options.timeout || 10000
    })
    this.log = new Log.ErrorOnly()
  }

  send (to, text) {
    return new Promise((resolve, reject) => {
      this.client.message.sendSms(this.from, to, text, (error, response) => {
        if (error) {
          return reject(error)
        } else {
          if (!response || !response.messages || !response.messages[0]) {
            this.log.error(`NEXMO_UNKNOWN_ERROR ${to}`, response)
            return reject(new Error('NEXMO_UNKNOWN_ERROR'))
          }
          if (response.messages[0].status === '0') {
            return resolve(response.messages[0])
          } else {
            return reject(new Error(response.messages[0]['error-text']))
          }
        }
      })
    })
  }
}

module.exports = Nexmo

/*
SAMPLE response.messages[0]
{
  to: '6587421234',
  'message-id': 'a46758e8-33d2-4db9-9a75-0993c517d3da',
  status: '0',
  'remaining-balance': '-31001.87755685',
  'message-price': '0.02150000',
  network: '52503'
}
*/
