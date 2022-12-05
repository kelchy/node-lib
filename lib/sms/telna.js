const axios = require('axios')
const common = require('@kelchy/common')
const Log = require('@kelchy/log')

class Telna {
  constructor (apiKey, apiSecret, from, options = {}) {
    if (!apiKey || !apiSecret || !from) {
      throw new Error('TELNA_CREDENTIALS_EMPTY')
    }
    // "from" can be overriden by telna
    this.host = 'https://ws.telna.com'
    this.distributorId = '69552'
    this.from = from
    this.apiKey = apiKey
    this.apiSecret = apiSecret
    this.timeout = options.timeout || 10000
    this.log = new Log.ErrorOnly()
  }

  async send (to, text) {
    const url = `${this.host}/ds/u/distributorPPUService/v1/${this.distributorId}/sim/${to}/sendSms`
    const config = {
      headers: {
        ApiKey: this.apiKey,
        Authorization: `Basic ${this.apiSecret}`
      }
    }
    const body = {
      senderCli: this.from,
      message: text
    }
    const { data, error } = await common.awaitWrap(axios.post(url, body, config))
    if (error) {
      throw error
    }
    if (data && data.data === '') {
      return {
        to,
        status: '0',
        message: 'ok'
      }
    } else if (data && data.data && data.data.status >= 400) {
      throw new Error(data.data.message)
    } else {
      throw new Error('TELNA_UNKNOWN_ERROR')
    }
  }
}

module.exports = Telna

/*
SAMPLE responses
    data: {
      status: 400,
      code: 0,
      message: 'iccid should be exactly 19 digits and only contain numbers',
      link: 'Not Available',
      developerMessage: 'iccid should be exactly 19 digits and only contain numbers',
      referenceId: null
    }

    data: {
      status: 400,
      code: 0,
      message: 'Invalid request body',
      link: 'Not Available',
      developerMessage: 'Invalid request body',
      referenceId: null
    }

    data: ''
*/
