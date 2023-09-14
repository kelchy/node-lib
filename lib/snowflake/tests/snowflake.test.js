const Snowflake = require('../index')
const Log = require('@kelchy/log')
const snowflakeSdk = require('snowflake-sdk')

const log = new Log.Empty({})

const VALID_URI =
  'snowflake://test_username:test_password@test_account.snowflakecomputing.com/?role=test_role&warehouse=test_warehouse'

jest.mock('snowflake-sdk')
snowflakeSdk.createConnection.mockImplementation((options) => {
  const { account, username, password } = options
  return {
    connect: (x) => {
      // decouple from the current event loop, simulate actual connect
      setImmediate(() => {
        if (
          account === 'incorrect' ||
          username === 'incorrect' ||
          password === 'incorrect'
        ) {
          x(new Error('error'))
        } else {
          x(null, {})
        }
      })
    },
    execute: ({ sqlText, binds, complete }) => {
      if (sqlText === 'error') {
        complete(new Error('error'))
      }
      const rows = [{ field_1: 'test' }]
      complete(null, null, rows)
    },
    isUp: () => {
      return true
    },
    destroy: (callback) => {
      callback(null, {
        getId: () => {
          return 'id123'
        }
      })
    }
  }
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('constructor()', () => {
  test('should emit on correct snowflake uri', (done) => {
    const snow = new Snowflake(VALID_URI)
    snow.on('SnowflakeReady', () => {
      done()
    })
  })
  test('should create snowflake connection with database arg if provided in uri', (
    done
  ) => {
    const uriWithDb =
      'snowflake://test_username:test_password@test_account.snowflakecomputing.com/?role=test_role&warehouse=test_warehouse&database=test_database'
    const snow = new Snowflake(uriWithDb, { log, clientSessionKeepAlive: true }) //eslint-disable-line
    expect(snow.log).toBe(log)
    expect(snowflakeSdk.createConnection).toBeCalledWith({
      account: 'test_account',
      password: 'test_password',
      role: 'test_role',
      username: 'test_username',
      warehouse: 'test_warehouse',
      database: 'test_database',
      clientSessionKeepAlive: true
    })
    done()
  })
  test('should create snowflake connection with schema arg if provided in uri', (
    done
  ) => {
    const uriWithDb =
      'snowflake://test_username:test_password@test_account.snowflakecomputing.com/?role=test_role&warehouse=test_warehouse&database=test_database&schema=test_schema'
    const snow = new Snowflake(uriWithDb) //eslint-disable-line
    expect(snowflakeSdk.createConnection).toBeCalledWith({
      account: 'test_account',
      password: 'test_password',
      role: 'test_role',
      username: 'test_username',
      warehouse: 'test_warehouse',
      database: 'test_database',
      schema: 'test_schema'
    })
    done()
  })
  test('should throw on invalid uri', (done) => {
    const uriNoAccount = 'invalid_uri'
    try {
      new Snowflake(uriNoAccount) //eslint-disable-line
    } catch (e) {
      expect(e.code).toEqual('ERR_INVALID_URL')
      expect(e.input).toEqual('invalid_uri')
    }
    done()
  })
  test('should throw missing account error on incorrect host', (done) => {
    const uriNoAccount =
      'snowflake://test_username:test_password@test_account.snow'
    try {
      new Snowflake(uriNoAccount) //eslint-disable-line
    } catch (e) {
      expect(e).toEqual(new Error('SNOWFLAKE_ACCOUNT_EMPTY'))
    }
    done()
  })
  test('should throw missing username error on missing username', (done) => {
    const uriNoUsername =
      'snowflake://:test_password@test_account.snowflakecomputing.com'
    try {
      new Snowflake(uriNoUsername) //eslint-disable-line
    } catch (e) {
      expect(e).toEqual(new Error('SNOWFLAKE_USERNAME_EMPTY'))
    }
    done()
  })
  test('should throw missing password error on missing password', (done) => {
    const uriNoPassword =
      'snowflake://test_username@test_account.snowflakecomputing.com'
    try {
      new Snowflake(uriNoPassword) //eslint-disable-line
    } catch (e) {
      expect(e).toEqual(new Error('SNOWFLAKE_PASSWORD_EMPTY'))
    }
    done()
  })
  test('should throw missing role error on missing role', (done) => {
    const uriNoRole =
      'snowflake://test_username:test_password@test_account.snowflakecomputing.com'
    try {
      new Snowflake(uriNoRole) //eslint-disable-line
    } catch (e) {
      expect(e).toEqual(new Error('SNOWFLAKE_ROLE_EMPTY'))
    }
    done()
  })
  test('should throw missing warehouse error on missing warehouse', (done) => {
    const uriNoWarehouse =
      'snowflake://test_username:test_password@test_account.snowflakecomputing.com/?role=test_role'
    try {
      new Snowflake(uriNoWarehouse) //eslint-disable-line
    } catch (e) {
      expect(e).toEqual(new Error('SNOWFLAKE_WAREHOUSE_EMPTY'))
    }
    done()
  })
  test('should log init error if incorrect account provided', (done) => {
    jest.spyOn(console, 'error').mockImplementation()
    const uriIncorrectAccount =
      'snowflake://test_username:test_password@incorrect.snowflakecomputing.com/?role=test_role&warehouse=test_warehouse'
    const log = new Log.Standard({ json: false })
    const snow = new Snowflake(uriIncorrectAccount, { log })
    setTimeout(() => {
      expect(snow.log).toEqual(log)
      expect(console.error).toHaveBeenCalledWith(
        expect.anything(),
        'SNOWFLAKE_INIT_CONNECT',
        'error'
      )
      done()
    }, 1000)
  })
})

describe('query()', () => {
  test('should return array of objects', (done) => {
    const sf = new Snowflake(VALID_URI)
    expect(sf.query('select * from employees', [])).resolves.toEqual([
      { field_1: 'test' }
    ])
    expect(sf.query('error', [])).rejects.toEqual(new Error('error'))
    done()
  })
})

describe('parseConnStr()', () => {
  test('should return creds on correct connection string', (done) => {
    const username = 'test_username'
    const password = 'test_password'
    const account = 'test_account'
    const role = 'test_role'
    const warehouse = 'test_warehouse'
    const database = 'test_database'
    const schema = 'test_schema'

    const connStr = `snowflake://${username}:${password}@${account}.snowflakecomputing.com/?role=${role}&warehouse=${warehouse}&database=${database}&schema=${schema}`

    const results = Snowflake.parseConnStr(connStr)

    expect(results.username).toStrictEqual(username)
    expect(results.password).toStrictEqual(password)
    expect(results.account).toStrictEqual(account)
    expect(results.role).toStrictEqual(role)
    expect(results.warehouse).toStrictEqual(warehouse)
    expect(results.database).toStrictEqual(database)
    expect(results.schema).toStrictEqual(schema)

    done()
  })

  test('should return null account on invalid host in connection string', (
    done
  ) => {
    const username = 'test_username'
    const password = 'test_password'
    const account = 'test_account'
    const role = 'test_role'
    const warehouse = 'test_warehouse'
    const database = 'test_database'
    const schema = 'test_schema'

    const connStr = `snowflake://${username}:${password}@${account}.invalid.com/?role=${role}&warehouse=${warehouse}&database=${database}&schema=${schema}`

    const results = Snowflake.parseConnStr(connStr)

    expect(results.username).toStrictEqual(username)
    expect(results.password).toStrictEqual(password)
    expect(results.account).toStrictEqual(null)
    expect(results.role).toStrictEqual(role)
    expect(results.warehouse).toStrictEqual(warehouse)
    expect(results.database).toStrictEqual(database)
    expect(results.schema).toStrictEqual(schema)

    done()
  })
})

describe('cleanup()', () => {
  test('happy path should destroy conn successfully', (done) => {
    const sf = new Snowflake(VALID_URI, { log })
    sf.cleanup((err, isSuccess) => {
      if (err) {
        throw new Error(err.message)
      }
      expect(isSuccess).toEqual(true)
      done()
    })
  })
  test('should not destroy conn when conn is not up', (done) => {
    snowflakeSdk.createConnection.mockImplementation((options) => {
      const { account, username, password } = options
      return {
        connect: (x) => {
          // decouple from the current event loop, simulate actual connect
          setImmediate(() => {
            if (
              account === 'incorrect' ||
              username === 'incorrect' ||
              password === 'incorrect'
            ) {
              x(new Error('error'))
            } else {
              x(null, {})
            }
          })
        },
        isUp: (x) => {
          return false
        },
        destroy: (callback) => {
          callback(new Error('error'), {
            getId: () => {
              return 'id123'
            }
          })
        }
      }
    })
    const sf = new Snowflake(VALID_URI, { log })
    sf.cleanup((err, isSuccess) => {
      if (err) {
        throw new Error(err.message)
      }
      expect(isSuccess).toEqual(true)
      done()
    })
  })
  test('should not destroy conn on error', (done) => {
    snowflakeSdk.createConnection.mockImplementation((options) => {
      const { account, username, password } = options
      return {
        connect: (x) => {
          // decouple from the current event loop, simulate actual connect
          setImmediate(() => {
            if (
              account === 'incorrect' ||
              username === 'incorrect' ||
              password === 'incorrect'
            ) {
              x(new Error('error'))
            } else {
              x(null, {})
            }
          })
        },
        isUp: (x) => {
          return true
        },
        destroy: (callback) => {
          callback(new Error('error'), {
            getId: () => {
              return 'id123'
            }
          })
        }
      }
    })
    const sf = new Snowflake(VALID_URI, { log })
    sf.cleanup((err, isSuccess) => {
      expect(err).toBeDefined()
      expect(isSuccess).toEqual(false)
      done()
    })
  })
})
