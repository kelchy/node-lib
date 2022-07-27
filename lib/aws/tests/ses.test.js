const aws = require('aws-sdk')
const mockfs = require('mock-fs')
const SES = require('../index').SES

afterEach(() => {
  mockfs.restore()
})

jest.mock('aws-sdk', () => {
  const EventEmitter = require('events').EventEmitter
  const evt = new EventEmitter()
  evt.destroy = jest.fn()
  return {
    SES: class {
      constructor (params) {
        this.sendRawEmail = () => {
          return {
            promise: jest.fn().mockResolvedValue({
              envelope: 'envelope',
              messageId: 'messageId',
              response: 'response',
              raw: 'raw'
            })
          }
        }
      }
    },
    Endpoint: jest.fn(),
    Credentials: jest.fn()
  }
})

const ses = new SES('access', 'secret')

describe('', () => {
  test('constructor should return', async (done) => {
    expect(ses).toHaveProperty('client')
    expect(ses).toHaveProperty('mailer')
    done()
  })
  test('constructor with error should log error', (done) => {
    const log = { out: () => {}, error: jest.fn(), debug: () => {} }
    const ses2 = new SES(null, 'secret', { endpoint: 'dummy', log })
    log.out(ses2) // for eslint
    expect(log.error).toHaveBeenLastCalledWith('SESError', expect.anything())
    const ses3 = new SES('access', null, { endpoint: 'dummy', log })
    log.out(ses3) // for eslint
    expect(aws.Credentials).toHaveBeenCalledTimes(3)
    expect(log.error).toHaveBeenLastCalledWith('SESError', expect.anything())
    expect(aws.Endpoint).toHaveBeenCalledTimes(2)
    expect(aws.Endpoint).toHaveBeenLastCalledWith('dummy')
    done()
  })
  test('send should send email and get response', async () => {
    const res = await ses.send('from', 'to', 'subject', { text: 'abc123' })
    expect(res).toHaveProperty('envelope')
    expect(res).toHaveProperty('messageId')
    expect(res).toHaveProperty('response')
    expect(res).toHaveProperty('raw')
  })
  test('send invalid params should error', async () => {
    expect(ses.send(null, 'to', 'subject')).rejects.toThrow('AWS SES - invalid parameters')
    expect(ses.send('from', null, 'subject')).rejects.toThrow('AWS SES - invalid parameters')
    expect(ses.send('from', 'to', null)).rejects.toThrow('AWS SES - invalid parameters')
    expect(ses.send(['from'], 'to', 'subject')).rejects.toThrow('AWS SES - invalid parameters')
  })
  test('send text or html should set params', async () => {
    const spy = jest.spyOn(ses.mailer, 'sendMail')
    await ses.send('from', 'to', 'subject', { text: 'abc123' })
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ text: 'abc123' }))
    await ses.send('from', ['to1', 'to2'], 'subject', { html: '<html></html>' })
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ to: ['to1', 'to2'], html: '<html></html>' }))
  })
  test('send attachment should set attachment', async () => {
    mockfs({ '/path/file': Buffer.from(['']) })
    const spy = jest.spyOn(ses.mailer, 'sendMail')
    await ses.send('from', 'to', 'subject', { attachments: ['/path/file'] })
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ attachments: [{ filename: 'file', path: '/path/file' }] }))
  })
  test('send attachment should set attachment with content', async () => {
    const spy = jest.spyOn(ses.mailer, 'sendMail')
    await ses.send('from', 'to', 'subject', { attachments: [{ filename: 'test.csv', content: 'test,content' }] })
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ attachments: [{ filename: 'test.csv', content: 'test,content' }] }))
  })
  test('add ses parameters should set ses params', async () => {
    const spy = jest.spyOn(ses.mailer, 'sendMail')
    await ses.send('from', 'to', 'subject', {
      ses: {
        ConfigurationSetName: 'test-config',
        Tags: [
          {
            Name: 'campaign',
            Value: 'test-campaign'
          }
        ]
      }
    })
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ses: {
          ConfigurationSetName: 'test-config',
          Tags: [
            {
              Name: 'campaign',
              Value: 'test-campaign'
            }
          ]
        }
      })
    )
  })
})
