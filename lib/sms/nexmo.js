const { Auth } = require('@vonage/auth')
const { Vonage } = require('@vonage/server-sdk')
const Log = require('@kelchy/log')
const common = require('@kelchy/common')

class Nexmo {
  constructor (apiKey, apiSecret, from, options = {}) {
    if (!apiKey || !apiSecret || !from) {
      throw new Error('NEXMO_CREDENTIALS_EMPTY')
    }
    // "from" can be overriden by nexmo
    this.from = from
    this.client = new Vonage(new Auth({
      apiKey,
      apiSecret
    }), {
      timeout: options.timeout || 10000
    })
    this.log = new Log.ErrorOnly()
  }

  async send (to, text) {
    const payload = {
      from: this.from,
      to,
      text
    }
    const { data, error } = await common.awaitWrap(this.client.sms.send(payload))
    if (error) {
      throw error
    }
    if (!data || !data.messages || !data.messages[0]) {
      this.log.error(`NEXMO_UNKNOWN_ERROR ${to}`, data)
      throw new Error('NEXMO_UNKNOWN_ERROR')
    }
    if (data.messages[0].status === '0') {
      return data.messages[0]
    }
    throw new Error(data.messages[0]['error-text'])
  }
}

module.exports = Nexmo

/*
SAMPLE data.messages[0]
{
  to: '65XXXXXXXX',
  'message-id': 'be18eb9c-0d36-4401-8935-0aff92abc9e3',
  status: '0',
  'remaining-balance': '-57369.69693726',
  'message-price': '0.02150000',
  network: 'XXXXX',
  messageId: 'be18eb9c-0d36-4401-8935-0aff92abc9e3',
  remainingBalance: '-57369.69693726',
  messagePrice: '0.02150000'
}
*/
