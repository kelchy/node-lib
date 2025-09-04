const Cloudfront = require('../index').Cloudfront

jest.mock('aws-sdk', () => {
  const EventEmitter = require('events').EventEmitter
  const evt = new EventEmitter()
  evt.destroy = jest.fn()
  return {
    CloudFront: class {
      constructor (params) {
        this.createInvalidation = (params) => {
          return {
            promise: async () => {
              if (params.DistributionId === 'error') throw params.DistributionId
              return params
            }
          }
        }
        this.params = params
        this.evt = evt
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

const cloudfront = new Cloudfront('access', 'secret')
describe('CloudFront tests', () => {
  test('constructor should return', (done) => {
    expect(cloudfront).toHaveProperty('client')
    done()
  })
  test('constructor with options should pass options', (done) => {
    const cloudfrontWithRegion = new Cloudfront('access', 'secret', { region: 'region' })
    expect(cloudfrontWithRegion.client.params.region).toEqual('region')
    done()
  })

  test('createInvalidation should pass to upload', async () => {
    const distributionId = 'distributionId'
    const paths = ['path1', 'path2']
    await expect(cloudfront.createInvalidation(distributionId, paths)).resolves.toEqual({
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: expect.any(String),
        Paths: {
          Quantity: 2,
          Items: paths
        }
      }
    })
  })

  test('createInvalidation should handle error', async () => {
    const distributionId = 'error'
    const paths = ['error']
    await expect(cloudfront.createInvalidation(distributionId, paths)).rejects.toEqual('error')
  })
})
