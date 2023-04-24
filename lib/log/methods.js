const axios = require('axios')
const common = require('@kelchy/common')

class Methods {
  constructor (options = {}) {
    // options.slack should be and object with at least token
    this.slackOptions = options.slack
  }

  // this function should never throw as application developers are not supposed to catch
  async slack (msg) {
    // check for token
    if (!this.slackOptions || !this.slackOptions.token) return

    // check whether object
    if (!common.isObject(msg)) return

    // override defaults
    if (!msg.username) {
      if (this.slackOptions.username) msg.username = this.slackOptions.username
    }
    if (!msg.channel) {
      if (this.slackOptions.channel) msg.channel = this.slackOptions.channel
    }
    if (!msg.icon_emoji) msg.icon_emoji = this.slackOptions.icon_emoji || ':ghost:'

    // send the request and catch so as to avoid throwing
    return axios.post(`https://hooks.slack.com/services/${this.slackOptions.token}`, msg, {
      timeout: 20000
    }).catch(e => this.error('slack', e.message))
  }
}

module.exports = Methods
