const AWS = require('aws-sdk')
const common = require('@kelchy/common')

class Cloudfront {
  constructor (accessKeyId, secretAccessKey, options = {}) {
    const credentials = new AWS.Credentials(accessKeyId, secretAccessKey)
    const region = options.region || 'ap-southeast-1'
    this.client = new AWS.CloudFront({ credentials, region })
  }

  async createInvalidation (distributionId, paths) {
    const params = {
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: Date.now().toString(),
        Paths: {
          Quantity: paths.length,
          Items: paths
        }
      }
    }
    const { data, error } = await common.awaitWrap(
      this.client.createInvalidation(params).promise()
    )
    if (error) {
      throw error
    }
    return data
  }
}

module.exports = Cloudfront
