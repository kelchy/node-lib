# Log

## This module wraps helper functions around logging to simplify development 

- Requires
```
axios

```

- Basic Initialization - empty = no logging
```
const Log = require('@kelchy/log')
const log = new Log.Empty()
```
- Standard logging - stdout and stderr
```
const Log = require('@kelchy/log')
const log = new Log.Standard()
```
- Disable json
```
const Log = require('@kelchy/log')
const log = new Log.Standard()
log.json = false
```
- Change date format to epoch
```
const Log = require('@kelchy/log')
const log = new Log.Standard()
log.dateFormat = 'epoch'
```
- Enable debugging
```
const Log = require('@kelchy/log')
const log = new Log.Standard()
log.debugging = true
```

- supported methods
```
out(scope, msg)
debug(scope, msg)
error(scope, msg)

slack(msg) - 'msg' contains a valid object with at least a 'text' key
```
