const AWS = require('aws-sdk')
const path = require('path')
const common = require('@kelchy/common')
const Log = require('@kelchy/log')
const nodemailer = require('nodemailer')

class SES {
  constructor (accessKeyId, secretAccessKey, options = {}) {
    // if application developer initializes its own logger
    // and pass it to the constructor i.e. they need logging to stdout
    // it should have 3 functions out, debug and error, if not, error only
    const log = Log.isValid(options.log) ? options.log : new Log.ErrorOnly()

    // log error but proceed, AWS SDK can take from env variable so they don't error out
    if (!accessKeyId || !secretAccessKey) { log.error('SESError', 'Empty Credentials') }
    const credentials = new AWS.Credentials(accessKeyId, secretAccessKey)
    // set default but allow override of region and apiVersion
    const region = options.region || 'ap-southeast-1'
    const apiVersion = options.apiVersion || '2010-12-01'
    const params = { region, apiVersion, credentials }
    if (options.endpoint) params.endpoint = new AWS.Endpoint(options.endpoint)

    this.client = new AWS.SES(params)
    this.mailer = nodemailer.createTransport({ SES: this.client })
  }

  // function will send an email
  // returns response data with messageId
  async send (from, to, subject, options = {}) {
    if (!from || !to || !subject || typeof from !== 'string') { throw Error('AWS SES - invalid parameters') }
    if (!common.isArray(to)) to = [to]
    const params = {
      from,
      to,
      subject
    }
    if (options.text) params.text = options.text
    else if (options.html) params.html = options.html
    if (options.attachments && common.isArray(options.attachments)) {
      const list = []
      options.attachments.forEach((file) => {
        if (file.content) {
          // File consists of name and content
          list.push({
            filename: file.filename,
            content: file.content
          })
        } else {
          list.push({
            // File consists only of filepath
            filename: path.basename(file),
            path: file
          })
        }
      })
      params.attachments = list
    }
    if (options.ses) params.ses = options.ses
    return this.mailer.sendMail(params)
  }
}

module.exports = SES
