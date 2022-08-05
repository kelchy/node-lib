const { OAuth2Client } = require('google-auth-library')
const common = require('@kelchy/common')
const Log = require('@kelchy/log')
const utils = require('./utils')
const Methods = require('./methods')

class Google extends Methods {
  constructor (tenant, service, domain, options = {}) {
    // if application developer initializes its own logger
    // and pass it to the constructor i.e. they need logging to stdout
    // it should have 3 functions out, debug and error, if not, do nothing
    const log = Log.isValid(options.log) ? options.log : new Log.Empty()

    // standardize
    tenant = tenant ? tenant.toLowerCase() : ''
    service = service ? service.toLowerCase() : ''
    domain = domain ? domain.toLowerCase() : ''

    // clientId is configured on google's portal, this should be the same clientId
    // used in the login page, along with the proper scopes like 'openid',
    // 'https://www.googleapis.com/auth/admin.directory.user.readonly',
    // 'https://www.googleapis.com/auth/userinfo.email',
    // 'https://www.googleapis.com/auth/admin.directory.customer.readonly',
    // 'https://www.googleapis.com/auth/userinfo.profile'
    if (!options.clientId) {
      if (tenant.toLowerCase() === 'sg') options.clientId = '637706008579-d2dmqbjjkbjcjt7ku76ilpsg94opnu0h.apps.googleusercontent.com'
    }

    const config = {
      tenant,
      service,
      domain,
      clientId: options.clientId,
      cacheTime: parseInt(options.cache) || 60 * 60 * 1000
    }

    // this will initialize common methods across different IAM providers
    super(config, { log })
    this.cache = options.cache === 0 ? undefined : {}
    this.log = log
    this.config = config
    this.client = options.clientId ? new OAuth2Client(config.clientId) : undefined
  }

  // function to check whether a given accessToken is valid on the provider side
  // application developer is expected to maintain a separate cached token and not call this
  // function everytime it wants to check validity of token
  async isTokenValid (accessToken, options = {}) {
    if (!options.fresh && this.cache && this.cache[accessToken]) return this.cache[accessToken]
    // fetch the user details
    const { data, error } = await common.awaitWrap(info(this.client, accessToken), { timeout: 2000 })
    if (error) throw common.error('AUTH_ID', error)
    if (!data || !data.id) throw common.error('AUTH_ID', new Error('UNKNOWN_USER'))
    const id = data.id

    // this is to prevent users using their personal google accounts to authenticate
    // extract the domain from the email address and compare with the instance config setting
    const domain = id.substring(id.lastIndexOf('@') + 1)
    if (this.config.domain !== domain) throw common.error('AUTH_ID', new Error('INVALID_DOMAIN'))

    const result = { id, domain, payload: data.payload }
    if (this.cache) {
      this.cache[accessToken] = result
      setTimeout(() => { delete this.cache[accessToken] }, this.config.cacheTime)
    }
    return result
  }

  // function to check whether a certain scope is allowed for an accessToken
  // if the user is already known, pass { id: user } to options
  // this will prevent another lookup for the user id
  async isOperationAllowed (accessToken, scope, options = {}) {
    const { data, error } = await common.awaitWrap(this.getMetadata(accessToken, options.id), { timeout: 2000 })
    if (error) throw common.error('AUTH_IS_ALLOWED', error)

    // data.resources is an array of all allowed scopes for the id derived from getMetadata
    // if not on the list, that means disallowed return false
    if (!data || !data.resources || data.resources.indexOf(scope) < 0) return false

    return true
  }

  // this function will fetch user's metadata
  async getMetadata (accessToken, id) {
    // if id unknown, fetch it
    if (!id) {
      const { data, error } = await common.awaitWrap(info(this.client, accessToken), { timeout: 2000 })
      if (error) throw common.error('AUTH_METADATA_ID', error)
      id = data.id
    }
    // this will get the groups associated with the user
    // for now we only support groups as metadata, but we can add more later
    return groups(accessToken, id)
  }
}

async function info (client, token) {
  // this will go to google to get the token information
  const { data, error } = await common.awaitWrap(client.getTokenInfo(token), { timeout: 2000 })
  if (error) {
    // in case google responds back with invalid_token, we should not throw
    const errData = error.response && error.response.data ? error.response.data : {}
    if (errData.error === 'invalid_token') return { id: undefined, payload: errData }
    throw common.error('AUTH_INFO', error)
  }

  // this is the email address of the owner of the accessToken, return if unknown
  const id = data ? data.email : undefined
  return { id, payload: data }
}

async function groups (token, id) {
  // prepare required parameters
  const url = `https://www.googleapis.com/admin/directory/v1/users/${id}?viewType=admin_view&projection=custom&customFieldMask=Custom_LDAP`
  const authorization = `Bearer ${token}`
  const headers = { authorization }

  // make the call and handle errors
  const { data, error } = await common.awaitWrap(utils.http(url, 'GET', undefined, { headers }), { timeout: 2000 })
  if (error) throw common.error('AUTH_GROUPS', error)
  if (!data || !data.data) throw common.error('AUTH_GROUPS', new Error('EMPTY'))

  // fetch the group list
  // this can be configured by the google workspace (gsuite) admin for now
  // in future we can explore how to do this programmatically
  const tag = common.getSafeValueFromNestedObject(data, ['data', 'customSchemas', 'Custom_LDAP', 'Tag']) || []
  return { id, resources: tag.map(o => { return o.value }), payload: data.data }
}

module.exports = Google
