const md5 = require('md5')
const fs = require('fs')
const crypto = require('crypto')

// we don't use class here as the nature of this file does not need classes
module.exports = {
  // returns boolean, checks if the arg is an array
  isArray: (q) => {
    if (q && Array.isArray(q)) return true
    else return false
  },

  // returns boolean, checks if the arg is an object
  isObject: (q) => {
    // careful here as arrays are also considered type object
    if (q && typeof q === 'object' && !Array.isArray(q)) return true
    else return false
  },

  // returns boolean, checks if the arg is an integer
  isInt: (num) => {
    return num !== '' && num % 1 === 0
  },

  // returns boolean, checks if the arg is an empty string
  isEmptyString: (str) => {
    if (typeof str !== 'string') return false
    return (!str || str.length === 0)
  },

  // creates a clone of an object, make sure that changes
  // made to the clone does not affect the original
  deepCopy: (obj) => {
    if (!obj) return obj
    return JSON.parse(JSON.stringify(obj))
  },

  // sort an array and create an md5sum of the array
  // useful for creating comparison/versioning for an array
  sortMd5: (fields) => {
    const kv = []
    for (const k in fields) kv.push([k, fields[k]])
    kv.sort()
    let str = ''
    for (let i = 0; i < kv.length; i++) {
      str += `${kv[i][0]}=${kv[i][1]};`
    }
    return md5(str.slice(0, -1))
  },

  // escape html characters
  escapeHtml: (string) => {
    const entityMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '\\': '&#92;'
    }

    return String(string).replace(/[&<>"'\/\\]/g, (s) => { // eslint-disable-line
      return entityMap[s]
    })
  },

  // escape regular expression characters
  escapeRegExp: (string) => {
    return String(string).replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&')
  },

  // move a file from 1 directory to another
  mv: (src, dst) => {
    return new Promise((resolve, reject) => {
      const source = fs.createReadStream(src)
      const dest = fs.createWriteStream(dst)

      source.pipe(dest)
      source.on('end', () => {
        fs.unlink(src, () => {
          resolve()
        })
      })
      source.on('error', (e) => {
        reject(e)
      })
    })
  },

  // prettify a kb value i.e. 1024 to 1MB in object form
  prettifyKBUnit: (kb) => {
    if (kb >= 1024 * 1024) {
      return { value: Math.round((kb / 1024 / 1024) * 10) / 10, unit: 'GB' }
    } else if (kb >= 1024) {
      return { value: Math.round(kb / 1024), unit: 'MB' }
    } else {
      return { value: 0, unit: 'MB' }
    }
  },

  // convert a kb value and fractions of it i.e. 10000 to 0.01
  convertToGb: (kb) => {
    const gb = kb / (1000 * 1000)
    return Number(gb.toFixed(2))
  },

  // compute the distance between 2 long/lat combination by using a bounding box
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 6371 // km (change this constant to get miles)
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const d = R * c
    return Number(d.toFixed(3))
  },

  // return an array with unique entries based on specified fields
  // if fields is empty, it will uniqify the whole set
  // if elements of array is not object, it will return empty array
  uniqify: (list, fields) => {
    /*
    * This function takes in an array of objects
    * and will create a unique list based on some of the
    * properties of the objects in the array.
    */
    if (!module.exports.isArray(list)) {
      return []
    }
    if (!fields || fields.length === 0) {
      return Array.from(new Set(list.map(JSON.stringify))).map(JSON.parse)
    }
    // create a temporary duplicate list
    // of objects with only said properties.
    const duplicateList = []
    list.forEach(ele => {
      const obj = {}
      fields.forEach(field => {
        if (ele[field] || ele[field] === '') {
          obj[field] = ele[field]
        }
      })
      if (JSON.stringify(obj) !== '{}') {
        duplicateList.push(obj)
      }
    })
    // uniqify the temp duplicate list.
    const tempUniqueList = Array.from(new Set(duplicateList.map(JSON.stringify))).map(JSON.parse)
    // return the original object with all the properties
    const uniqueList = []
    tempUniqueList.forEach(elem => {
      const uniqueAddon = list.find(dupElement => {
        return Object.keys(elem).every(key => {
          return dupElement[key] === elem[key]
        })
      })
      uniqueList.push(uniqueAddon)
    })
    return uniqueList
  },

  // avoid try catch by wrapping await promises inside this
  // include an optional timeout parameter to make sure it returns in time
  // returns an object with 2 fields, data and error
  awaitWrap: (promise, options) => {
    if (!options) options = {}
    const prAwaitWrap = options.timeout && parseInt(options.timeout) > 0
      ? promiseTimeout(promise, parseInt(options.timeout))
      : promise
    return prAwaitWrap
      .then(data => ({ data, error: null }))
      .catch(error => ({ error, data: null }))
  },

  // avoid crashes when accessing values inside deeply nested objects
  // first arg is the object, second arg is an array to denote the order
  // in which the fields are to be accessed, returns the retrieved value
  // or undefined if any issue arises
  getSafeValueFromNestedObject: (sourceObj, targetArr) => {
    return targetArr.reduce((obj, key) =>
      (obj && obj[key] !== 'undefined') ? obj[key] : undefined, sourceObj)
  },

  // returns json object if valid json
  // returns the same string if not a proper json
  jsonSafe: (str) => {
    try {
      return JSON.parse(str)
    } catch (ex) {
      return str
    }
  },

  // returns an error object with added detail on the message to indicate the scope
  // scope must be string and err must be an error object. ignore if the incorrect format
  error: (scope, err) => {
    if (scope && typeof scope === 'string' &&
      err instanceof Error) err.message = `[${scope}] ${err.message}`
    return err
  },

  // create a cryptographically secure randomizer
  // options.min is inclusive
  // options.max is exclusive
  random: (digits, options = {}) => {
    const min = options.min || 0
    const max = options.max || 9
    let rnd = crypto.randomInt(min, max).toString()
    for (let i = 1; i < digits; i++) rnd += crypto.randomInt(min, max).toString()
    return rnd
  }
}

// used by awaitWrap, if optional timeout is used
function promiseTimeout (promise, timeout) {
  return Promise.race([promise, new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('TIMEOUT'))
    }, timeout)
  })])
}
