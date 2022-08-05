const axios = require('axios')
const Auth = require('../index')
const Log = require('@kelchy/log')
const common = require('@kelchy/common')
const Methods = require('../methods')
const utils = require('../utils')
const freeipa = new Auth.Freeipa('sg', 'service', 'domain.com')
const google = new Auth.Google('sg', 'service', 'domain.net')

jest.useFakeTimers()
jest.mock('axios', () => {
  return {
    post: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue(true)
  }
})
jest.mock('google-auth-library', () => {
  return { OAuth2Client: jest.fn() }
})
const { OAuth2Client } = require('google-auth-library')
jest.spyOn(console, 'log').mockImplementation()

describe('auth tests', () => {
  test('new empty instance should have minimal properties: config, log', (done) => {
    const freeipa = new Auth.Freeipa()
    const google = new Auth.Google()

    expect(freeipa).toHaveProperty('config')
    expect(google).toHaveProperty('config')

    expect(freeipa).toHaveProperty('log')
    expect(google).toHaveProperty('log')
    done()
  })
  test('new instance with parameters should have it defined', (done) => {
    let ipa = new Auth.Freeipa('tenant', 'service', 'domain', { log: new Log.Standard(), cache: 60 * 1000 })
    let ggle = new Auth.Google('tenant', 'service', 'domain', { log: new Log.Standard(), cache: 60 * 1000 })

    expect(ipa.config.tenant).toEqual('tenant')
    expect(ggle.config.tenant).toEqual('tenant')

    expect(ipa.config.service).toEqual('service')
    expect(ggle.config.service).toEqual('service')

    expect(ipa.config.domain).toEqual('domain')
    expect(ggle.config.domain).toEqual('domain')

    expect(ipa.log.type).toEqual('standard')
    expect(ggle.log.type).toEqual('standard')

    expect(ipa.cache).toEqual({})
    expect(ggle.cache).toEqual({})
    expect(ipa.config.cacheTime).toEqual(60 * 1000)
    expect(ggle.config.cacheTime).toEqual(60 * 1000)

    ipa = new Auth.Freeipa('tenant', 'service', 'domain', { cache: 0 })
    ggle = new Auth.Google('tenant', 'service', 'domain', { cache: 0 })
    expect(ipa.cache).toEqual(undefined)
    expect(ggle.cache).toEqual(undefined)

    // freeipa only as google does not need baseUrl
    ipa = new Auth.Freeipa('tenant', 'service', 'domain', { baseUrl: 'mock' })
    expect(ipa.config.baseUrl).toEqual('mock')
    done()
  })
  it('creating new methods without config should return error', async (done) => {
    try { new Methods() } catch (e) { expect(e).toEqual(new Error('[AUTH_METHODS] NO_CONFIG')) } // eslint-disable-line
    done()
  })
  it('creating new methods without options log should have empty log instance', async (done) => {
    const m = new Methods({})
    expect(m.log.type).toEqual('empty')
    done()
  })
  it('generateToken should return token object, google return error', async (done) => {
    const { error } = await common.awaitWrap(google.generateToken('id', 'secret'))
    expect(error).toEqual(new Error('[AUTH] GENERATE_TOKEN_NOT_IMPLEMENTED'))

    axios.post.mockResolvedValue({ headers: { ipasession: 'ipasession' } })
    const res = await freeipa.generateToken('id', 'secret')
    expect(res.accessToken).toEqual('ipasession')
    done()
  })
  it('invalid functions should return error', async (done) => {
    const { error: err1 } = await common.awaitWrap(google.refreshToken('token'))
    expect(err1).toEqual(new Error('[AUTH] REFRESH_TOKEN_NOT_IMPLEMENTED'))
    const { error: err2 } = await common.awaitWrap(freeipa.refreshToken('token'))
    expect(err2).toEqual(new Error('[AUTH] REFRESH_TOKEN_NOT_IMPLEMENTED'))

    const { error: err3 } = await common.awaitWrap(google.getScope('token'))
    expect(err3).toEqual(new Error('[AUTH] GET_SCOPE_NOT_IMPLEMENTED'))
    const { error: err4 } = await common.awaitWrap(freeipa.getScope('token'))
    expect(err4).toEqual(new Error('[AUTH] GET_SCOPE_NOT_IMPLEMENTED'))
    done()
  })
  it('invalid functions which are overriden should return error', async (done) => {
    const methods = new Methods({})
    const { error: err1 } = await common.awaitWrap(methods.isTokenValid('token'))
    expect(err1).toEqual(new Error('[AUTH] TOKEN_VALID_NOT_IMPLEMENTED'))
    const { error: err2 } = await common.awaitWrap(methods.isOperationAllowed('token'))
    expect(err2).toEqual(new Error('[AUTH] IS_ALLOWED_NOT_IMPLEMENTED'))
    const { error: err3 } = await common.awaitWrap(methods.getMetadata('token'))
    expect(err3).toEqual(new Error('[AUTH] GET_METADATA_NOT_IMPLEMENTED'))
    done()
  })
  it('isTokenValid should return object with at least id and domain', async (done) => {
    // for google
    OAuth2Client.mockImplementation(() => {
      return {
        getTokenInfo: jest.fn().mockImplementation(async (arg) => {
          if (arg === 'domainmatch') return { email: 'test@test.com' }
          if (arg === 'domainwrong') return { email: 'test.test.com' }
          if (arg === 'empty') return undefined
          if (arg === 'error') throw new Error('TEST')
          if (arg === 'invalid') {
            const e = new Error('invalid_token')
            e.response = { data: { error: 'invalid_token', error_description: 'Invalid Value' } }
            throw e
          }
          return { email: 'test@domain.net' }
        })
      }
    })

    const Google = require('../index').Google
    const google = new Google('tenant', 'service', 'domain.net', { clientId: 'mock', cache: 0 })

    // for freeipa
    const freeipa = new Auth.Freeipa('sg', 'service', 'domain.com', { cache: 0 })
    axios.post.mockImplementation(async (url = '', payload = '', options) => {
      if (options.headers.cookie.toString() === 'ipa_session=empty') return { data: {} }
      if (options.headers.cookie.toString() === 'ipa_session=error') throw new Error('TEST')
      if (options.headers.cookie.toString() === 'ipa_session=invalid') {
        const e = new Error('invalid')
        e.statusCode = 401
        throw e
      }
      return { data: { result: { arguments: ['test'] } } }
    })

    const { error: err1 } = await common.awaitWrap(google.isTokenValid('invalid'))
    expect(err1).toEqual(new Error('[AUTH_ID] UNKNOWN_USER'))
    const { error: err2 } = await common.awaitWrap(google.isTokenValid('empty'))
    expect(err2).toEqual(new Error('[AUTH_ID] UNKNOWN_USER'))
    const { error: err3 } = await common.awaitWrap(freeipa.isTokenValid('invalid'))
    expect(err3).toEqual(new Error('[AUTH_ID] UNKNOWN_USER'))
    const { error: err4 } = await common.awaitWrap(freeipa.isTokenValid('empty'))
    expect(err4).toEqual(new Error('[AUTH_ID] UNKNOWN_USER'))

    const { error: err5 } = await common.awaitWrap(google.isTokenValid('error'))
    expect(err5).toEqual(new Error('[AUTH_ID] [AUTH_INFO] TEST'))
    const { error: err6 } = await common.awaitWrap(freeipa.isTokenValid('error'))
    expect(err6).toEqual(new Error('[AUTH_ID] [AUTH_INFO] TEST'))

    // this test case is only applicable on google
    const { error: err7 } = await common.awaitWrap(google.isTokenValid('domainmatch'))
    expect(err7).toEqual(new Error('[AUTH_ID] INVALID_DOMAIN'))
    const { error: err8 } = await common.awaitWrap(google.isTokenValid('domainwrong'))
    expect(err8).toEqual(new Error('[AUTH_ID] INVALID_DOMAIN'))

    const fres = await freeipa.isTokenValid('mock')
    const gres = await google.isTokenValid('mock')

    expect(fres.id).toEqual('test')
    expect(gres.id).toEqual('test@domain.net')

    expect(fres.domain).toEqual('domain.com')
    expect(gres.domain).toEqual('domain.net')

    const freeipacache = new Auth.Freeipa('sg', 'service', 'domain.com', { cache: 60 * 1000 })
    const googlecache = new Google('tenant', 'service', 'domain.net', { clientId: 'mock', cache: 60 * 1000 })

    await freeipacache.isTokenValid('mock')
    await googlecache.isTokenValid('mock')
    expect(axios.post).toHaveBeenCalledTimes(6)
    expect(googlecache.client.getTokenInfo).toHaveBeenCalledTimes(1)

    await freeipacache.isTokenValid('mock')
    await googlecache.isTokenValid('mock')
    expect(axios.post).toHaveBeenCalledTimes(6)
    expect(googlecache.client.getTokenInfo).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(60 * 1000)

    await freeipacache.isTokenValid('mock')
    await googlecache.isTokenValid('mock')
    expect(axios.post).toHaveBeenCalledTimes(7)
    expect(googlecache.client.getTokenInfo).toHaveBeenCalledTimes(2)

    await freeipacache.isTokenValid('mock', { fresh: true })
    await googlecache.isTokenValid('mock', { fresh: true })
    expect(axios.post).toHaveBeenCalledTimes(8)
    expect(googlecache.client.getTokenInfo).toHaveBeenCalledTimes(3)

    done()
  })
  it('isOperationAllowed should return boolean or error', async (done) => {
    // for google
    OAuth2Client.mockImplementation(() => { return { getTokenInfo: async (arg) => { return { email: 'test@domain.net' } } } })

    const Google = require('../index').Google
    const google = new Google('tenant', 'service', 'domain.net', { clientId: 'mock' })

    async function handler (url = '', payload = '', options) {
      // google
      if (options.headers.authorization === 'Bearer error') throw new Error('ERROR')
      if (options.headers.authorization === 'Bearer mock') {
        return { data: { customSchemas: { Custom_LDAP: { Tag: [{ value: 'test' }] } } } }
      }

      // freeipa
      if (payload.method === 'whoami/1') return { data: { result: { arguments: ['test'] } } }
      if (options.headers.cookie.toString() === 'ipa_session=error') throw new Error('ERROR')
      return { data: { result: { result: { memberof_group: ['test'] } } } }
    }
    // for freeipa and group fetch on google
    axios.get.mockImplementation(handler)
    axios.post.mockImplementation(handler)

    expect(await freeipa.isOperationAllowed('mock', 'test')).toEqual(true)
    expect(await google.isOperationAllowed('mock', 'test')).toEqual(true)

    expect(await freeipa.isOperationAllowed('mock', 'tes')).toEqual(false)
    expect(await google.isOperationAllowed('mock', 'tes')).toEqual(false)

    const { error: err1 } = await common.awaitWrap(freeipa.isOperationAllowed('error'))
    expect(err1).toEqual(new Error('[AUTH_IS_ALLOWED] [AUTH_GROUPS] ERROR'))
    const { error: err2 } = await common.awaitWrap(google.isOperationAllowed('error'))
    expect(err2).toEqual(new Error('[AUTH_IS_ALLOWED] [AUTH_GROUPS] ERROR'))
    done()
  })
  it('getMetadata should return object or error', async (done) => {
    // for google
    OAuth2Client.mockImplementation(() => { return { getTokenInfo: async (arg) => { throw new Error('ERROR') } } })

    const Google = require('../index').Google
    const google = new Google('tenant', 'service', 'domain.net', { clientId: 'mock' })

    // for freeipa
    axios.post.mockImplementation(async (url = '', payload, options = {}) => {
      // freeipa
      if (payload.method === 'whoami/1') throw new Error('ERROR')
    })

    const { error: err1 } = await common.awaitWrap(freeipa.getMetadata('error'))
    expect(err1).toEqual(new Error('[AUTH_METADATA_ID] [AUTH_INFO] ERROR'))
    const { error: err2 } = await common.awaitWrap(google.getMetadata('error'))
    expect(err2).toEqual(new Error('[AUTH_METADATA_ID] [AUTH_INFO] ERROR'))
    done()
  })
  it('empty getMetadata http response should be handled accordingly', async (done) => {
    // for google
    OAuth2Client.mockImplementation(() => { return { getTokenInfo: async (arg) => { return { email: undefined } } } })

    const Google = require('../index').Google
    const google = new Google('tenant', 'service', 'domain.net', { clientId: 'mock' })

    // group fetch for google
    axios.get.mockImplementation(async (url = '', payload = {}, options) => {
      if (options.headers.authorization === 'Bearer empty') return {}
      if (options.headers.authorization === 'Bearer unknown') return { data: { customSchemas: { Custom_LDAP: {} } } }
    })

    // for freeipa
    axios.post.mockImplementation(async (url = '', payload, options) => {
      // login and no cookie
      if (!options.headers.cookie) throw new Error('ERROR')

      if (payload.method === 'whoami/1') {
        if (options.headers.cookie.toString() === 'ipa_session=unknown') return { data: { result: { arguments: ['test@test.com'] } } }
        return {}
      }
      if (options.headers.cookie.toString() === 'ipa_session=unknown') return { data: { result: {} } }
      if (options.headers.cookie.toString() === 'ipa_session=empty') return {}
    })
    // login and whoami only applicable to freeipa
    const { error: err1 } = await common.awaitWrap(freeipa.generateToken())
    expect(err1).toEqual(new Error('[AUTH_LOGIN] ERROR'))
    const { error: err2 } = await common.awaitWrap(freeipa.isTokenValid())
    expect(err2).toEqual(new Error('[AUTH_ID] [AUTH_INFO] EMPTY'))

    const { error: err3 } = await common.awaitWrap(freeipa.getMetadata('empty', 'id'))
    expect(err3).toEqual(new Error('[AUTH_GROUPS] EMPTY'))
    const { error: err4 } = await common.awaitWrap(google.getMetadata('empty', 'id'))
    expect(err4).toEqual(new Error('[AUTH_GROUPS] EMPTY'))
    const fres = await freeipa.getMetadata('unknown')
    expect(fres.resources).toEqual([])
    const gres = await google.getMetadata('unknown')
    expect(gres.resources).toEqual([])
    done()
  })
  it('sendUserActionLog should send to stdout', (done) => {
    let methods = new Methods({})
    methods.sendUserActionLog()
    expect(console.log).toHaveBeenCalledTimes(1)
    methods = new Methods({}, { log: new Log.Standard() })
    methods.sendUserActionLog()
    expect(console.log).toHaveBeenCalledTimes(2)
    done()
  })
  it('no payload to utils.http when form options is set should work', async (done) => {
    axios.get.mockImplementation(async (url, payload, options) => { return options.form })
    expect(await utils.http('url', 'get', null, { form: true })).toEqual(undefined)
    expect(await utils.http('url', 'get')).toEqual(undefined)
    done()
  })
})
