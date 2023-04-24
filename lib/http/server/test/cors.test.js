const request = require('supertest')

const Server = require('../index')
const cors = {
  url: ['https://localhost:1234'],
  domain: ['domain.com', 'domain2.com']
}
const server = new Server(3081, { cors })

afterAll(() => {
  server.conn.close()
})

describe('origins test', () => {
  test('allowed url should be allowed', async () => {
    const res = await request(server.app)
      .get('/ping')
      .set({ origin: 'https://localhost:1234' })
    expect(res.headers).toHaveProperty('access-control-allow-origin')
  })
  test('allowed domain should be allowed', async () => {
    const res = await request(server.app)
      .get('/ping')
      .set({ origin: 'https://www.domain.com' })
    expect(res.headers).toHaveProperty('access-control-allow-origin')
  })
  test('disallowed url should be disallowed', async () => {
    const res = await request(server.app)
      .get('/ping')
      .set({ origin: 'https://localhost:1235' })
    expect(res.headers).not.toHaveProperty('access-control-allow-origin')
  })
  test('disallowed domain should be disallowed', async () => {
    const res = await request(server.app)
      .get('/ping')
      .set({ origin: 'https://www.domain.co' })
    expect(res.headers).not.toHaveProperty('access-control-allow-origin')
  })
  test('empty origin should be disallowed', async () => {
    const res = await request(server.app)
      .get('/ping')
      .set({ origin: '' })
    expect(res.headers).not.toHaveProperty('access-control-allow-origin')
  })
})
