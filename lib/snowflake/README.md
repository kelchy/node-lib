# Snowflake
## This module wraps helper functions around snowflake to simplify development 

### Connect to Snowflake
```
const Snowflake = require('@kelchy/snowflake')
const Log = require('@kelchy/log')
const { awaitWrap } = require('@kelchy/common')

// Initialise log

const log = new Log.Standard({})

// Initialise snowflake connection URI

const SNOWFLAKE_URI = 'snowflake://<username>:<password>@<account>.snowflakecomputing.com/?role=<role>&warehouse=<warehouse>&database=<database>&schema=<schema>'

// Connect to snowflake
// Success should log: {"scope":"connect db","msg":"Successfully connected to Snowflake","ts":"2021-12-21T10:30:55.183Z"}

const snowflake = new Snowflake(SNOWFLAKE_URI, {
    log, // optional log option
    clientSessionKeepAlive: true // optional snowflake conn option
})

```

### SELECT query example
```
const testSelectQuery = async () => {
    let query = 'SELECT * FROM example_table LIMIT 10'
    const { data, error } = await awaitWrap(snowflake.query(query.trim()))
    if(error) {
        log.error(error.message)
        return
    }
    log.debug(data)
}
testSelectQuery()
```