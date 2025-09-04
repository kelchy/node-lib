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
    const server = new Server(5001, { log })
    setImmediate(() => {
      expect(console.log).toHaveBeenLastCalledWith(
        expect.stringContaining('listening on PORT 5001')
      )
      server.conn.close()
      done()
    })
  })
  test('ping should pong', (done) => {
    const server = new Server(5002)
    request(server.app)
      .get('/ping')
      .then(res => {
        expect(res.statusCode).toBe(200)
        server.conn.close()
        done()
      })
  })
  test('no ping should not pong', (done) => {
    const server = new Server(5003, { ping: false })
    request(server.app)
      .get('/ping')
      .then(res => {
        expect(res.statusCode).toBe(404)
        server.conn.close()
        done()
      })
  })
  test('swagger doc should swag', (done) => {
    const doc = Server.swaggerDoc()
    const server = new Server(5004, { swagger: { doc } })
    request(server.app)
      .get('/docs')
      .then(res => {
        expect(res.statusCode).toBe(301)
        server.conn.close()
        done()
      })
  })
  test('no swagger doc should also swag', (done) => {
    const server = new Server(5005, { logRequest: false, swagger: { } })
    request(server.app)
      .get('/docs')
      .then(res => {
        expect(res.statusCode).toBe(301)
        server.conn.close()
        done()
      })
  })
  test('rawBody true should populate request with rawBody key and value', (done) => {
    const server = new Server(5006, { rawBody: true })
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
  test('ratelimit should be applied by default', (done) => {
    const server = new Server(5007)
    request(server.app)
      .get('/ping')
      .then(res => {
        expect(res.statusCode).toBe(200)
        expect(res.headers['ratelimit-limit']).toBeDefined()
        expect(res.headers['ratelimit-remaining']).toBeDefined()
        server.conn.close()
        done()
      })
  })
  test('ratelimit with custom number should work', (done) => {
    const server = new Server(5008, {
      ratelimit: 5 // limit each IP to 5 requests per 15 minutes
    })
    request(server.app)
      .get('/ping')
      .then(res => {
        expect(res.statusCode).toBe(200)
        expect(res.headers['ratelimit-limit']).toBe('5')
        server.conn.close()
        done()
      })
  })
  test('ratelimit should block requests when limit exceeded', (done) => {
    const server = new Server(5009, {
      ratelimit: 1 // limit each IP to 1 request per 15 minutes
    })

    // First request should succeed
    request(server.app)
      .get('/ping')
      .then(res => {
        expect(res.statusCode).toBe(200)

        // Second request should be rate limited
        return request(server.app).get('/ping')
      })
      .then(res => {
        expect(res.statusCode).toBe(429)
        expect(res.text).toBe('Too many requests, please try again later.')
        server.conn.close()
        done()
      })
      .catch(err => {
        server.conn.close()
        done(err)
      })
  })
})
