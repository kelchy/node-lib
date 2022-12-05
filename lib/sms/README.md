# SMS

## This module wraps helper functions around Short Messaging Service (SMS) functionality to simplify development 

- Requires
```
axios
@vonage/server-sdk
```

- Basic Initialization - Nexmo
```
const SMS = require('@kelchy/sms')
const key = 'abc123'
const secret = 'abc123'
const sender = 'CompanyA'
const sms = new SMS.Nexmo(key, secret, sender)
```
depending on situation, "sender" might be overriden by the service provider

- Basic Initialization - Telna
```
const SMS = require('@kelchy/sms')
const key = 'abc123'
const secret = 'abc123'
const sender = '14081234567'
const sms = new SMS.Telna(key, secret, sender)
```
sender must be numeric

- supported methods
```
send(destination, msg)
```
