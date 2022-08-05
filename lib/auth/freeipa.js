const tough = require('tough-cookie')
const common = require('@kelchy/common')
const Log = require('@kelchy/log')
const Methods = require('./methods')
const utils = require('./utils')

const version = 2.231

class Freeipa extends Methods {
  constructor (tenant, service, domain, options = {}) {
    // if application developer initializes its own logger
    // and pass it to the constructor i.e. they need logging to stdout
    // it should have 3 functions out, debug and error, if not, do nothing
    const log = Log.isValid(options.log) ? options.log : new Log.Empty()

    // standardize
    tenant = tenant ? tenant.toLowerCase() : ''
    service = service ? service.toLowerCase() : ''
    domain = domain ? domain.toLowerCase() : ''

    // prepare the baseUrl based off the tenant if not specified on options
    if (!options.baseUrl) {
      const host = tenant === 'sg' ? 'pm1in-freeipa-01' : undefined
      if (host && domain) options.baseUrl = `https://${host}.${domain}`
    }

    const config = {
      tenant,
      service,
      domain,
      baseUrl: options.baseUrl,
      cacheTime: parseInt(options.cache) || 60 * 60 * 1000
    }

    // this will initialize common methods across different IAM providers
    super(config, { log })
    this.cache = options.cache === 0 ? undefined : {}
    this.log = log
    this.config = config
  }

  // given a username and password, this function will fetch the accessToken using the login function
  async generateToken (id, secret) {
    return login(this.config.baseUrl, id, secret)
  }

  // given the accessToken, we will fetch the user info through the whoami function
  async isTokenValid (accessToken, options = {}) {
    if (!options.fresh && this.cache && this.cache[accessToken]) return this.cache[accessToken]
    const { data, error } = await common.awaitWrap(whoami(this.config.baseUrl, accessToken))
    if (error) throw common.error('AUTH_ID', error)
    if (!data || !data.id) throw common.error('AUTH_ID', new Error('UNKNOWN_USER'))
    const result = { id: data.id, domain: this.config.domain, payload: data.payload }
    if (this.cache) {
      this.cache[accessToken] = result
      setTimeout(() => { delete this.cache[accessToken] }, this.config.cacheTime)
    }
    return result
  }

  // this function will match a user's list of allowed groups to the given scope
  // if id is provided in options, we won't need to lookup
  async isOperationAllowed (accessToken, scope, options = {}) {
    const { data, error } = await common.awaitWrap(this.getMetadata(accessToken, options.id), { timeout: 2000 })
    if (error) throw common.error('AUTH_IS_ALLOWED', error)

    // data.resources is an array of all allowed scopes for the id derived from getMetadata
    // if not on the list, that means disallowed return false
    if (data && data.resources && data.resources.indexOf(scope) > -1) return true
    return false
  }

  // this function will fetch user's metadata
  async getMetadata (accessToken, id) {
    const url = this.config.baseUrl
    // if id was not provided, lookup
    if (!id) {
      const { data, error } = await common.awaitWrap(whoami(url, accessToken))
      if (error) throw common.error('AUTH_METADATA_ID', error)
      id = data.id
    }
    // this will get the groups associated with the user
    // for now we only support groups as metadata, but we can add more later
    return groups(url, accessToken, id)
  }
}

// prepare required headers
function headers (url, accessToken) {
  const cookie = tough.Cookie.parse(`ipa_session=${accessToken}`, { loose: true })
  const referer = `${url}/ipa`
  return { cookie, referer }
}

// login to the IAM with user (id) and password (secret)
async function login (url, id, secret) {
  const uri = `${url}/ipa/session/login_password`

  const { data, error } = await common.awaitWrap(utils.http(uri, 'POST', { user: id, password: secret }, { form: true }), { timeout: 2000 })
  if (error) throw common.error('AUTH_LOGIN', error)

  return {
    tokenType: 'Bearer',
    accessToken: common.getSafeValueFromNestedObject(data, ['headers', 'ipasession'])
  }
}

// identify who owns the access token
async function whoami (url, token) {
  const uri = `${url}/ipa/session/json`
  const payload = { method: 'whoami/1', params: [[], { version }] }

  const { data, error } = await common.awaitWrap(utils.http(uri, 'POST', payload, { headers: headers(url, token) }), { timeout: 2000 })
  if (error) {
    if (error.statusCode === 401) return { id: undefined, payload: error.message }
    throw common.error('AUTH_INFO', error)
  }
  if (!data || !data.data) throw common.error('AUTH_INFO', new Error('EMPTY'))

  const id = common.getSafeValueFromNestedObject(data, ['data', 'result', 'arguments']) || []
  return { id: id[0], payload: data.data }
}

// identify groups associated with user
async function groups (url, token, id) {
  const uri = `${url}/ipa/session/json`
  const ushow = { method: 'user_show', params: [[id], { version }] }

  const { data, error } = await common.awaitWrap(utils.http(uri, 'POST', ushow, { headers: headers(url, token) }), { timeout: 2000 })
  if (error) throw common.error('AUTH_GROUPS', error)
  if (!data || !data.data) throw common.error('AUTH_GROUPS', new Error('EMPTY'))

  const resources = common.getSafeValueFromNestedObject(data, ['data', 'result', 'result', 'memberof_group']) || []
  return { id, resources, payload: data.data }
}

module.exports = Freeipa
