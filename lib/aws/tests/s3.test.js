const S3 = require('../index').S3

jest.mock('aws-sdk', () => {
  const EventEmitter = require('events').EventEmitter
  const evt = new EventEmitter()
  evt.destroy = jest.fn()
  return {
    S3: class {
      constructor (params) {
        this.getObject = jest.fn().mockImplementation((params) => {
          return {
            promise: async () => {
              if (params.Bucket === 'error') throw params.Bucket
              return { Body: Buffer.from('abcdef') }
            }
          }
        })
        this.upload = (params) => {
          return {
            promise: async () => {
              if (params.Body.error) throw params.Body.error
              return params
            }
          }
        }
        this.deleteObject = (params) => {
          return {
            promise: async () => {
              if (params.VersionId === 'error') throw params.VersionId
              return params
            }
          }
        }
        this.listObjectVersions = (params) => {
          return {
            promise: async () => {
              if (params.Prefix === 'error') throw params.Prefix
              return [1, 2, 3]
            }
          }
        }
        this.listObjectsV2 = (params) => {
          return {
            promise: async () => {
              if (params.Bucket === 'NextContinuationToken') {
                const i = params.ContinuationToken || 1
                const next = i === 3 ? null : i + 1
                if (i === 2 && params.Prefix === 'error') throw params.Prefix
                return { NextContinuationToken: next, Contents: [{ Key: i }], CommonPrefixes: [] }
              }
              if (params.Prefix === 'error') throw params.Prefix
              return { Contents: [{ Key: 1 }, { Key: 2 }, { Key: 3 }], CommonPrefixes: [] }
            }
          }
        }
        this.params = params
        this.evt = evt
      }
    },
    Endpoint: class {
      constructor (endpoint) {
        this.endpoint = endpoint
      }
    },
    Credentials: class {
      constructor (accessKeyId, secretAccessKey) {
        this.accessKeyId = accessKeyId
        this.secretAccessKey = secretAccessKey
      }
    }
  }
})

const s3 = new S3('access', 'secret')

describe('', () => {
  test('constructor should return', async (done) => {
    expect(s3).toHaveProperty('client')
    done()
  })
  test('constructor with endpoint should call Endpoint', async (done) => {
    const s3e = new S3(null, 'secret', { endpoint: 'dummy', log: { out: () => {}, error: () => {}, debug: () => {} } })
    expect(s3e.client.params.endpoint.endpoint).toEqual('dummy')
    const s3e2 = new S3('access', null, { endpoint: 'dummy', log: { out: () => {}, error: () => {}, debug: () => {} } })
    expect(s3e2.client.params.endpoint.endpoint).toEqual('dummy')
    done()
  })
  test('getS3Object error should reject error', async (done) => {
    expect(s3.getS3Object('error', 'error')).rejects.toEqual('error')
    done()
  })
  test('getS3Object should return', async (done) => {
    const res = await s3.getS3Object('bucket', 'key')
    expect(res).toEqual({ Body: Buffer.from('abcdef') })
    done()
  })
  test('getS3Object with encoding should convert', async (done) => {
    const res = await s3.getS3Object('bucket', 'key', { encoding: 'utf8' })
    expect(res).toEqual({ Body: 'abcdef' })
    done()
  })
  test('getS3Object with versionId should pass to getObject', async (done) => {
    const bucket = 'bucket'
    const key = 'key'
    const versionId = '1234'
    await s3.getS3Object(bucket, key, { versionId })
    expect(s3.client.getObject).toHaveBeenLastCalledWith({ Bucket: bucket, Key: key, VersionId: versionId })
    done()
  })
  test('putS3Object error should return error', (done) => {
    const bucket = 'bucket'
    const key = 'key'
    const payload = { error: true }
    expect(s3.putS3Object(bucket, key, payload)).rejects.toEqual(true)
    done()
  })
  test('putS3Object should pass to upload', (done) => {
    const bucket = 'bucket'
    const key = 'key'
    const payload = { result: 1 }
    expect(s3.putS3Object(bucket, key, payload)).resolves.toEqual({ Bucket: bucket, Key: key, Body: payload })
    done()
  })
  test('delS3Object error should return error', (done) => {
    const bucket = 'bucket'
    const key = 'key'
    const versionId = 'error'
    expect(s3.delS3Object(bucket, key, { versionId })).rejects.toEqual('error')
    done()
  })
  test('delS3Object should pass to deleteObject', (done) => {
    const bucket = 'bucket'
    const key = 'key'
    expect(s3.delS3Object(bucket, key)).resolves.toEqual({ Bucket: 'bucket', Key: 'key' })
    done()
  })
  test('listS3ObjectVersions error should return error', (done) => {
    const bucket = 'bucket'
    const prefix = 'error'
    expect(s3.listS3ObjectVersions(bucket, prefix)).rejects.toEqual('error')
    done()
  })
  test('listS3ObjectVersions should pass to listObjectVersions', (done) => {
    const bucket = 'bucket'
    const prefix = 'prefix'
    expect(s3.listS3ObjectVersions(bucket, prefix)).resolves.toEqual([1, 2, 3])
    done()
  })
  test('listS3Objects error should throw', (done) => {
    expect(s3.listS3Objects('bucket', 'error')).rejects.toEqual('error')
    done()
  })
  test('listS3Objects should return list', (done) => {
    expect(s3.listS3Objects('bucket', 'prefix', { delimiter: '/' })).resolves.toEqual({ list: [1, 2, 3], commonPrefixes: [] })
    done()
  })
  test('listS3Objects with NextContinuationToken error should throw', (done) => {
    expect(s3.listS3Objects('NextContinuationToken', 'error')).rejects.toEqual('error')
    done()
  })
  test('listS3Objects with NextContinuationToken should return list', (done) => {
    expect(s3.listS3Objects('NextContinuationToken', 'prefix')).resolves.toEqual({ list: [1, 2, 3], commonPrefixes: [] })
    done()
  })
})
