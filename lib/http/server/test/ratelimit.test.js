const express = require('express')
const request = require('supertest')

// Mock express-rate-limit to avoid external dependency issues
jest.mock('express-rate-limit', () => {
  return jest.fn((config) => {
    let requestCount = 0
    const max = config.max || 480
    const windowMs = config.windowMs || 60000

    return (req, res, next) => {
      requestCount++

      if (requestCount > max) {
        return res.status(429).json({ error: 'Too many requests' })
      }

      res.set('X-RateLimit-Limit', max)
      res.set('X-RateLimit-Remaining', Math.max(0, max - requestCount))
      res.set('X-RateLimit-Reset', new Date(Date.now() + windowMs).toISOString())

      next()
    }
  })
})

const Ratelimit = require('../middleware/ratelimit')

describe('Rate Limiting Middleware Tests', () => {
  let app
  let server

  beforeEach(() => {
    app = express()
    app.use(express.json())
  })

  afterEach(() => {
    if (server) {
      server.close()
    }
  })

  test('should use default rate limiter with 480 requests per minute', (done) => {
    app.use(Ratelimit.ratelimit)
    app.get('/test', (req, res) => {
      res.json({ message: 'Success' })
    })

    server = app.listen(0, () => {
      request(app)
        .get('/test')
        .expect(200)
        .expect('X-RateLimit-Limit', '480')
        .expect('X-RateLimit-Remaining', '479')
        .end((err) => {
          if (err) return done(err)
          done()
        })
    })
  })

  test('should create custom rate limiter with different limits', () => {
    const customRateLimiter = Ratelimit.create({
      max: 100,
      windowMs: 30000
    })

    expect(typeof customRateLimiter).toBe('function')

    // Test that it's a middleware function
    const mockReq = {}
    const mockRes = {
      set: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const mockNext = jest.fn()

    customRateLimiter(mockReq, mockRes, mockNext)

    expect(mockNext).toHaveBeenCalled()
  })

  test('should merge custom config with default config', () => {
    const customRateLimiter = Ratelimit.create({
      max: 200
    })

    expect(typeof customRateLimiter).toBe('function')
  })

  test('should handle rate limiting correctly', (done) => {
    // Create a rate limiter with very low limit for testing
    const testRateLimiter = Ratelimit.create({
      max: 2,
      windowMs: 60000
    })

    app.use(testRateLimiter)
    app.get('/test', (req, res) => {
      res.json({ message: 'Success' })
    })

    server = app.listen(0, () => {
      // First request should succeed
      request(app)
        .get('/test')
        .expect(200)
        .expect('X-RateLimit-Remaining', '1')
        .end((err) => {
          if (err) return done(err)

          // Second request should succeed
          request(app)
            .get('/test')
            .expect(200)
            .expect('X-RateLimit-Remaining', '0')
            .end((err) => {
              if (err) return done(err)

              // Third request should be rate limited
              request(app)
                .get('/test')
                .expect(429)
                .end((err) => {
                  if (err) return done(err)
                  done()
                })
            })
        })
    })
  })

  test('should export both class and static method', () => {
    expect(Ratelimit).toBeDefined()
    expect(Ratelimit.ratelimit).toBeDefined()
    expect(typeof Ratelimit.ratelimit).toBe('function')
    expect(typeof Ratelimit.create).toBe('function')
  })

  test('should maintain backward compatibility', (done) => {
    // Test that the old usage pattern still works
    app.use(Ratelimit.ratelimit)
    app.get('/test', (req, res) => {
      res.json({ message: 'Backward compatible' })
    })

    server = app.listen(0, () => {
      request(app)
        .get('/test')
        .expect(200)
        .end((err) => {
          if (err) return done(err)
          done()
        })
    })
  })

  test('should handle lazy initialization of default rate limiter', () => {
    // Reset the module to test lazy initialization
    jest.resetModules()

    // Mock express-rate-limit again after reset
    jest.doMock('express-rate-limit', () => {
      return jest.fn((config) => {
        return (req, res, next) => {
          res.set('X-RateLimit-Limit', config.max)
          next()
        }
      })
    })

    const FreshRatelimit = require('../middleware/ratelimit')

    // Test that the static method works and creates the rate limiter
    const mockReq = {}
    const mockRes = {
      set: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const mockNext = jest.fn()

    FreshRatelimit.ratelimit(mockReq, mockRes, mockNext)

    expect(mockNext).toHaveBeenCalled()
    expect(mockRes.set).toHaveBeenCalledWith('X-RateLimit-Limit', 480)
  })

  test('should handle create method with no parameters (default config)', () => {
    // Test the default parameter branch in create method
    const defaultRateLimiter = Ratelimit.create()

    expect(typeof defaultRateLimiter).toBe('function')

    // Test that it uses default config
    const mockReq = {}
    const mockRes = {
      set: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const mockNext = jest.fn()

    defaultRateLimiter(mockReq, mockRes, mockNext)

    expect(mockNext).toHaveBeenCalled()
    expect(mockRes.set).toHaveBeenCalledWith('X-RateLimit-Limit', 480)
  })
})
