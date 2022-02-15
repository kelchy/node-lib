const AWS = require('aws-sdk')
const common = require('@kelchy/common')
const Log = require('@kelchy/log')

class S3 {
  constructor (accessKeyId, secretAccessKey, options = {}) {
    // if application developer initializes its own logger
    // and pass it to the constructor i.e. they need logging to stdout
    // it should have 3 functions out, debug and error, if not, do nothing
    const log = Log.isValid(options.log) ? options.log : new Log.ErrorOnly()

    // log error but proceed, AWS SDK can take from env variable so they don't error out
    if (!accessKeyId || !secretAccessKey) log.error('S3Error', 'Empty Credentials')
    const credentials = new AWS.Credentials(accessKeyId, secretAccessKey)
    // set default but allow override of region and apiVersion
    const region = options.region || 'ap-southeast-1'
    const apiVersion = options.apiVersion || '2006-03-01'
    const params = { region, apiVersion, credentials }
    if (options.endpoint) params.endpoint = new AWS.Endpoint(options.endpoint)

    this.client = new AWS.S3(params)
  }

  // function will return buffer payload
  // if no encoding options provided, application developer need to do a .toString('utf8') to convert Body to string
  // returns payload, with or without content, or throws error
  async getS3Object (bucket, key, options = {}) {
    const { versionId } = options
    const params = { Bucket: bucket, Key: key }
    if (versionId) params.VersionId = versionId
    const { data, error } = await common.awaitWrap(this.client.getObject(params).promise())
    if (error) throw error
    if (!options.encoding) return data
    data.Body = data.Body.toString(options.encoding)
    return data
  }

  // function to upload payload to s3
  putS3Object (bucket, key, payload) {
    return this.client.upload({ Bucket: bucket, Key: key, Body: payload }).promise()
  }

  // function to delete an object, optional versionId which will just delete a specific version
  async delS3Object (bucket, key, options = {}) {
    const { versionId } = options
    const params = { Bucket: bucket, Key: key }
    if (versionId) params.VersionId = versionId
    return this.client.deleteObject(params).promise()
  }

  // function to retrieve versioning details of an object(s) which starts with a prefix
  async listS3ObjectVersions (bucket, prefix) {
    return this.client.listObjectVersions({ Bucket: bucket, Prefix: prefix }).promise()
  }

  // function to retrieve list of objects from bucket
  async listS3Objects (bucket, prefix, options = {}) {
    let list = []
    const params = { Bucket: bucket, Prefix: prefix }
    if (options.delimiter) params.Delimiter = options.delimiter
    const { data, error } = await common.awaitWrap(this.client.listObjectsV2(params).promise())
    if (error) throw error
    list = list.concat(data.Contents.map(o => { return o.Key }))
    let NextContinuationToken = data.NextContinuationToken
    while (NextContinuationToken) {
      params.ContinuationToken = NextContinuationToken
      const { data, error } = await common.awaitWrap(this.client.listObjectsV2(params).promise())
      if (error) throw error
      list = list.concat(data.Contents.map(o => { return o.Key }))
      NextContinuationToken = data.NextContinuationToken
    }
    return { list, commonPrefixes: data.CommonPrefixes }
  }
}

module.exports = S3
