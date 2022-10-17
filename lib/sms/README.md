# SMS

## This module wraps helper functions around Short Messaging Service (SMS) functionality to simplify development 

- Requires
```
axios

```

- Basic Initialization - Nexmo
```
const SMS = require('@kelchy/sms')
const sender = 'CompanyA'
const key = 'abc123'
const sms = new SMS.Nexmo(sender, key)
```
depending on situation, "sender" might be overriden by the service provider

- supported methods
```
send(destination, msg)
```
