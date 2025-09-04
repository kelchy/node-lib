const request = require('supertest')
const Log = require('@kelchy/log')

const Server = require('../index')

jest.spyOn(console, 'log').mockImplementation()

describe('http server tests', () => {
  test('new empty instance should have minimal properties: conn, app, log', (done) => {
    const log = new Log.Standard()
    const server = new Server(null, { log, limit: '1mb' })
    expect(server).toHaveProperty('conn')
    expect(server).toHaveProperty('app')
    expect(server).toHaveProperty('log')
    setImmediate(() => {
      expect(console.log).toHaveBeenLastCalledWith(
        expect.stringContaining('listening on PORT 3080')
      )
      server.conn.close()
      done()
    })
  })
  test('override port should override', (done) => {
    const log = new Log.Standard()
    // Use a random port to avoid conflicts
    const testPort = Math.floor(Math.random() * 10000) + 10000
    const server = new Server(testPort, { log })
    setImmediate(() => {
      expect(console.log).toHaveBeenLastCalledWith(
        expect.stringContaining(`listening on PORT ${testPort}`)
      )
      server.conn.close()
      done()
    })
  })
  test('ping should pong', (done) => {
    const testPort = Math.floor(Math.random() * 10000) + 10000
    const server = new Server(testPort)
    request(server.app)
      .get('/ping')
      .then(res => {
        expect(res.statusCode).toBe(200)
        server.conn.close()
        done()
      })
  })
  test('no ping should not pong', (done) => {
    const testPort = Math.floor(Math.random() * 10000) + 10000
    const server = new Server(testPort, { ping: false })
    request(server.app)
      .get('/ping')
      .then(res => {
        expect(res.statusCode).toBe(404)
        server.conn.close()
        done()
      })
  })
  test('swagger doc should swag', (done) => {
    const testPort = Math.floor(Math.random() * 10000) + 10000
    const doc = Server.swaggerDoc()
    const server = new Server(testPort, { swagger: { doc } })
    request(server.app)
      .get('/docs')
      .then(res => {
        expect(res.statusCode).toBe(301)
        server.conn.close()
        done()
      })
  })
  test('no swagger doc should also swag', (done) => {
    const testPort = Math.floor(Math.random() * 10000) + 10000
    const server = new Server(testPort, { logRequest: false, swagger: { } })
    request(server.app)
      .get('/docs')
      .then(res => {
        expect(res.statusCode).toBe(301)
        server.conn.close()
        done()
      })
  })
  test('rawBody true should populate request with rawBody key and value', (done) => {
    const testPort = Math.floor(Math.random() * 10000) + 10000
    const server = new Server(testPort, { rawBody: true })
    server.app.post('/', (req, res) => {
      const rawBody = req.rawBody
      return res.status(200).json({ rawBody })
    })
    const mockReq = { value: 'testValue' }
    request(server.app)
      .post('/')
      .send(mockReq)
      .then(res => {
        expect(res._body.rawBody).toBe(JSON.stringify(mockReq))
        server.conn.close()
        done()
      })
  })
})
