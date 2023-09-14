const Log = require('@kelchy/log')
const Client = require('../index')

describe('http client tests', () => {
  test('new empty instance should have minimal properties: log, timeout', (done) => {
    const client = new Client()
    expect(client).toHaveProperty('log')
    expect(client).toHaveProperty('timeout')
    done()
  })
  test('instance with log should have minimal properties: log, timeout', (done) => {
    const log = new Log.Standard()
    const client = new Client({ log })
    expect(client).toHaveProperty('log')
    expect(client).toHaveProperty('timeout')
    done()
  })
})
