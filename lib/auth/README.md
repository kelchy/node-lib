# Auth

## This module wraps helper functions around authentication and authorization to simplify development 

- Requires
```
tough-cookie
google-auth-library
axios
```

- Basic Initialization - freeipa or google client
```
const Auth = require('@kelchy/auth')
//const auth = new Auth.Freeipa('sg', 'telco', 'domain.com')
const auth = new Auth.Google('sg', 'telco', 'domain.com')
```
- Custom client options - override baseUrl for freeipa instead of the tenant specific default endpoints
```
const auth = new Auth.Freeipa('sg', 'telco', 'domain.com', { baseUrl: 'https://freeipa.domain.net' })
```
- Custom client options - override clientId for google instead of the tenant specific default clientId
```
const auth = new Auth.Google('sg', 'telco', 'domain.com', { clientId: 'xxxx123yyy456zzz789' })
```
- Custom client options - override default 1 hour cache time to 30 mins (cache only applicable to isTokenValid for now)
```
const gauth = new Auth.Google('sg', 'telco', 'domain.com', { cache: 30 * 60 * 1000 })
const fauth = new Auth.Freeipa('sg', 'telco', 'domain.com', { cache: 30 * 60 * 1000 })
```
- Custom client options - disable cache
```
const gauth = new Auth.Google('sg', 'telco', 'domain.com', { cache: 0 })
const fauth = new Auth.Freeipa('sg', 'telco', 'domain.com', { cache: 0 })
```
- Turn internal logging on
```
const Log = require('@kelchy/log')
const auth = new Auth.Google('sg', 'telco', 'domain.com', { log: new Log.Standard() })
```

- supported methods
```
generateToken(id, secret) - create an access token, given the credentials
isTokenValid(token, options) - check if access token is valid, optional { fresh: true } to force library to fetch from IAM provider
isOperationAllowed(token, scope) - check if scope is allowed given the token
getMetadata(token) - get metadata associated with token

```
