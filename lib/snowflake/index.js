const EventEmitter = require('events').EventEmitter
const snowflake = require('snowflake-sdk')
const Log = require('@kelchy/log')

class Snowflake extends EventEmitter {
  constructor (uri, options = {}) {
    // separate log option with other connection options
    const { log: logOption, ...connOptions } = options

    // if application developer initializes its own logger
    // and pass it to the constructor i.e. they need logging to stdout
    // it should have 3 functions out, debug and error, if not, do nothing
    const log = Log.isValid(logOption) ? logOption : new Log.ErrorOnly()

    const {
      account,
      username,
      password,
      role,
      warehouse,
      database,
      schema
    } = Snowflake.parseConnStr(uri)

    // valdiate required snowflake creds
    // account and username are required
    if (!account) {
      throw new Error('SNOWFLAKE_ACCOUNT_EMPTY')
    } else if (!username) {
      throw new Error('SNOWFLAKE_USERNAME_EMPTY')
    } else if (!password) {
      throw new Error('SNOWFLAKE_PASSWORD_EMPTY')
    } else if (!role) {
      throw new Error('SNOWFLAKE_ROLE_EMPTY')
    } else if (!warehouse) {
      throw new Error('SNOWFLAKE_WAREHOUSE_EMPTY')
    }
    super()

    // create a Connection object that we can use later to connect
    // see https://docs.snowflake.com/en/user-guide/nodejs-driver-use.html#setting-the-connection-options for options
    const conn = snowflake.createConnection({
      account,
      username,
      password,
      role,
      warehouse,
      ...(database && { database }), // only add database if provided
      ...(schema && { schema }), // only add schema if provided
      ...connOptions // add additional connection options if provided
    })

    conn.connect((err) => {
      if (err) {
        log.error('SNOWFLAKE_INIT_CONNECT', err.message)
      } else {
        log.out('connect db', 'Successfully connected to Snowflake')
        this.emit('SnowflakeReady')
      }
    })

    this.conn = conn
    this.log = log
  }

  /**
   *
   * @param {string} connStr - format: "snowflake://<username>:<password>@<account>.snowflakecomputing.com/?role=<role>&warehouse=<warehouse>&database=<database>&schema=<schema>"
   * @returns snowflake credentials obj
   */
  static parseConnStr (connStr) {
    const url = new URL(connStr)
    const query = new URLSearchParams(url.search)

    // extract account from host
    let account = null
    const hostMatch = url.host.match(/^(.*?).snowflakecomputing.com/)
    if (hostMatch && hostMatch.length > 0) {
      account = hostMatch[1]
    }

    // URL Encoding (percent encoding) was done automatically, need to decode to get the real characters
    const password = decodeURIComponent(url.password)

    const username = url.username
    const role = query.get('role')
    const warehouse = query.get('warehouse')
    const database = query.get('database')
    const schema = query.get('schema')

    return { account, username, password, role, warehouse, database, schema }
  }

  /**
   *
   * @param {string} sqlText - sql query
   * @param {Array<number>} binds - numbers to replace in sql query e.g. for sqlText 'select * from emp where age = ?', use [18]
   * @returns {Promise<string>} result rows
   */
  async query (sqlText, binds) {
    return new Promise((resolve, reject) => {
      this.conn.execute({
        sqlText,
        binds,
        complete: (err, stmt, rows) => {
          if (err) reject(err)
          resolve(rows)
        }
      })
    })
  }
}

module.exports = Snowflake
