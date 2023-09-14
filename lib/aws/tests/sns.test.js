const SNS = require('../index').SNS
const aws = require('aws-sdk')
// mock promise methods
jest.mock('aws-sdk', () => {
  const EventEmitter = require('events').EventEmitter
  const evt = new EventEmitter()
  evt.destroy = jest.fn()
  return {
    SNS: class {
      constructor (params) {
        this.setSMSAttributes = jest.fn().mockImplementation(() => {})
        this.publish = jest.fn().mockImplementation((params) => {
          return {
            promise: async () => {
              if (params.Message === 'error') {
                throw params.Message
              }
              return { MessageId: 'id', SequenceNumber: '1' } // some random id
            }
          }
        })
      }
    },
    Credentials: jest.fn()
  }
})

const sns = new SNS('access', 'secret')

describe('Testing SNS', () => {
  test('constructor should establish client', (done) => {
    expect(sns).toHaveProperty('client')
    expect(sns.client.setSMSAttributes).toHaveBeenCalled()
    done()
  })

  test('constructor with error should log error', (done) => {
    const log = { out: () => {}, error: jest.fn(), debug: () => {} }
    const sns2 = new SNS(null, 'secret', { endpoint: 'dummy', log })
    log.out(sns2) // for eslint
    expect(log.error).toHaveBeenLastCalledWith('SNSError', expect.anything())
    const sns3 = new SNS('access', null, { endpoint: 'dummy', log })
    log.out(sns3) // for eslint
    expect(aws.Credentials).toHaveBeenCalledTimes(3)
    expect(log.error).toHaveBeenLastCalledWith('SNSError', expect.anything())
    done()
  })

  test('invalid param should return error', (done) => {
    // invalid number
    expect(sns.send('9', 'valid message', 'valid subject')).rejects.toThrow('AWS SNS - invalid parameters')

    // invalid message
    expect(sns.send('+6599999999', 1, 'valid subject')).rejects.toThrow('AWS SNS - invalid parameters')

    expect(sns.send('+6599999999', null, 'valid subject')).rejects.toThrow('AWS SNS - invalid parameters')

    // invalid subject
    expect(sns.send('+6599999999', 'valid message', '5YxYXhSXvS5vLzKqO8D3dNruZ9AyUqy9nM5fjpNC69NLF2lu2fw7j86K16snVciDXx2Uz9gqBLCS0H3gdFkmqiy0FZTuCV6jlJYKd')
    ).rejects.toThrow('AWS SNS - invalid parameters')

    done()
  })

  test('SNS.send should send SMS and get response', async () => {
    const spy = jest.spyOn(sns.client, 'publish')
    const res = await sns.send(
      '+6599999999',
      'This is a valid message',
      'This is a valid subject'
    )

    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({
      Message: 'This is a valid message',
      PhoneNumber: '+6599999999',
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': {
          DataType: 'String',
          StringValue: 'This is a valid subject'
        }
      }
    }))

    expect(res).toHaveProperty('MessageId')
    expect(res).toHaveProperty('SequenceNumber')
  })

  test('SNS.send with no subject should send SMS and get response', async () => {
    const spy = jest.spyOn(sns.client, 'publish')
    const res = await sns.send(
      '+6599999999',
      'This is a valid message'
    )

    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        Message: 'This is a valid message',
        PhoneNumber: '+6599999999',
        MessageAttributes: {
          'AWS.SNS.SMS.SenderID': {
            DataType: 'String',
            StringValue: ''
          }
        }
      })
    )

    expect(res).toHaveProperty('MessageId')
    expect(res).toHaveProperty('SequenceNumber')
  })

  test('SNS.send error should throw', (done) => {
    expect(sns.send('+6599999999', 'error', 'this is a valid subject')).rejects.toEqual('error')

    done()
  })
})
