const common = require('../index')
const fs = require('fs')
const fsPromises = fs.promises

jest.unmock('os')
const os = jest.requireActual('os')

describe('common functions tests', () => {
  test('isArray should return boolean', (done) => {
    expect(common.isArray(['a', 1])).toEqual(true)
    expect(common.isArray({ a: 1 })).toEqual(false)
    done()
  })
  test('isObject should return boolean', (done) => {
    expect(common.isObject({ a: 1 })).toEqual(true)
    expect(common.isObject(1)).toEqual(false)
    done()
  })
  test('isInt should return boolean', (done) => {
    expect(common.isInt(1)).toEqual(true)
    expect(common.isInt('')).toEqual(false)
    done()
  })
  test('isEmptyString should return boolean', (done) => {
    expect(common.isEmptyString('')).toEqual(true)
    expect(common.isEmptyString('a')).toEqual(false)
    expect(common.isEmptyString(0)).toEqual(false)
    done()
  })
  test('deepCopy should return a clone', (done) => {
    expect(common.deepCopy()).toEqual(undefined)
    const actual = common.deepCopy({ a: 1 })
    expect(actual).toEqual({ a: 1 })
    actual.b = 2
    expect(actual).not.toEqual({ a: 1 })
    done()
  })
  test('sortMd5 should return a hash', (done) => {
    expect(common.sortMd5({ a: 1, b: 2 })).toEqual(common.sortMd5({ b: 2, a: 1 }))
    expect(common.sortMd5({ a: 2, b: 3 })).not.toEqual(common.sortMd5({ b: 2, a: 1 }))
    done()
  })
  test('escapeHtml should return a string', (done) => {
    expect('&amp;&lt;&gt;&quot;&#39;&#x2F;&#92;').toEqual(common.escapeHtml('&<>"\'/\\'))
    done()
  })
  test('escapeRegExp should return a string', (done) => {
    expect('\\.\\?\\*\\+\\^\\$\\[\\]\\(\\)\\{\\}\\|\\-').toEqual(common.escapeRegExp('.?*+^$[]\(){}|-'))  // eslint-disable-line
    done()
  })
  test('mv should move a file', async (done) => {
    const src = '/tmp/test-src'
    const dst = '/tmp/test-dst'
    await fsPromises.unlink(src).catch(() => {})
    await fsPromises.unlink(dst).catch(() => {})
    fs.closeSync(fs.openSync(src, 'w'))
    await common.mv(src, dst).catch(() => {})
    expect(() => fs.readFileSync(src, 'utf8')).toThrow()
    expect(common.mv(src, dst)).rejects.toThrow()
    await fsPromises.unlink(dst).catch(() => {})
    done()
  })
  test('prettifyKBUnit should return an object', (done) => {
    expect({ unit: 'GB', value: 1 }).toEqual(common.prettifyKBUnit(1024 * 1024))
    expect({ unit: 'MB', value: 1 }).toEqual(common.prettifyKBUnit(1024))
    expect({ unit: 'MB', value: 0 }).toEqual(common.prettifyKBUnit(0))
    done()
  })
  test('calculateDistance should return an integer', (done) => {
    expect(common.calculateDistance(1, 2, 3, 4)).toEqual(314.403)
    expect(common.calculateDistance(0.001, 0.003, 0.002, 0.004)).toEqual(0.157)
    expect(common.calculateDistance(0.001, 0.03, 0.002, 0.04)).toEqual(1.117)
    done()
  })
  test('convertToGb should return an integer', (done) => {
    expect(common.convertToGb(1000 * 1000)).toEqual(1)
    expect(common.convertToGb(10 * 1000)).toEqual(0.01)
    done()
  })
  test('uniqify should return an array', (done) => {
    expect([]).toEqual(common.uniqify())
    expect([{ a: 1 }, { b: 2 }]).toEqual(common.uniqify([{ a: 1 }, { b: 2 }, { a: 1 }]))
    expect([{ b: 2 }]).toEqual(common.uniqify([{ a: 1 }, { b: 2 }, { a: 1 }], ['b']))
    expect([{ a: 1 }, { a: 1, c: 3 }]).toEqual(common.uniqify([{ a: 1 }, { b: 2 }, { a: 1, c: 3 }], ['a', 'c']))
    done()
  })
  test('awaitWrap should return an object', async () => {
    const f1 = new Promise(resolve => { resolve('OK') })
    const { data: d1 } = await common.awaitWrap(f1)
    expect(d1).toEqual('OK')
    const f2 = new Promise(resolve => { setTimeout(() => { resolve('OK') }, 20) })
    const { timeout } = await common.awaitWrap(f2, { timeout: 10 })
    expect(timeout).not.toEqual(null)
  })
  test('getSafeValueFromNestedObject should not throw', (done) => {
    const o = {
      a: { b: { c: 1 } }
    }
    expect(common.getSafeValueFromNestedObject(o, ['a', 'b', 'c'])).toEqual(1)
    expect(common.getSafeValueFromNestedObject(o, ['a', 'd', 'c'])).toEqual(undefined)
    done()
  })
  test('jsonSafe should not throw', (done) => {
    expect({ a: 1 }).toEqual(common.jsonSafe('{"a":1}'))
    expect('{a:1}').toEqual(common.jsonSafe('{a:1}'))
    done()
  })
  test('error should concat message', (done) => {
    let e = common.error('TEST', new Error('Error'))
    expect(e).toEqual(new Error('[TEST] Error'))
    e = common.error(123, new Error('Error'))
    expect(e).toEqual(new Error('Error'))
    e = common.error('TEST', 'Error')
    expect(e).toEqual('Error')
    done()
  })
  test('random should generate correct length with min max', (done) => {
    expect(common.random(4).length).toEqual(4)
    expect(['00', '01', '10', '11']).toContain(common.random(2, { min: 0, max: 2 }))
    done()
  })
  test('myName should return string', (done) => {
    expect(typeof common.myName()).toEqual('string')
    done()
  })
  test('myAddr should return string', (done) => {
    const v4 = { family: 'IPv4', address: '1.2.3.4' }
    const v6 = { family: 'IPv6', address: '2401::' }
    os.networkInterfaces = jest.fn(() => { return { ens0: [v4] } })
    expect(typeof common.myAddr()).toEqual('string')
    os.networkInterfaces = jest.fn(() => { return { eth0: [v6] } })
    expect(typeof common.myAddr()).toEqual('string')
    os.networkInterfaces = jest.fn(() => { return { eth0: [] } })
    expect(typeof common.myAddr()).toEqual('string')
    expect(typeof common.myAddr('eth0')).toEqual('string')
    expect(typeof common.myAddr('ens0')).toEqual('string')
    done()
  })
  test('home should return string', (done) => {
    expect(typeof common.home()).toEqual('string')
    done()
  })
  test('isAlive should return boolean', async (done) => {
    const alive = await common.isAlive('8.8.8.8', 853)
    expect(typeof alive).toEqual('boolean')
    const host = await common.isAlive('', 53)
    expect(host).toEqual(false)
    const port = await common.isAlive('127.0.0.53', 0)
    expect(port).toEqual(false)
    const dead = await common.isAlive('127.0.0.127', 53)
    expect(dead).toEqual(false)
    done()
  })
  test('valid ipv4 should return true', (done) => {
    expect(common.isIPv4('1.2.3.4')).toEqual(true)
    done()
  })
  test('invalid ipv4 should return false', (done) => {
    expect(common.isIPv4('1.2.3.a')).toEqual(false)
    expect(common.isIPv4('1.2.3.400')).toEqual(false)
    done()
  })
  test('valid ipv6 should return true', (done) => {
    expect(common.isIPv6('2001:db8:3333:4444:5555:6666:7777:8888')).toEqual(true)
    expect(common.isIPv6('::0')).toEqual(true)
    done()
  })
  test('invalid ipv7 should return false', (done) => {
    expect(common.isIPv6('200x:db8:3333:4444:5555:6666:7777:8888')).toEqual(false)
    expect(common.isIPv6('2001:0')).toEqual(false)
    done()
  })
})
