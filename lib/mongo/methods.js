const mongoDb = require('mongodb')

class Methods {
  static readPreference () {
    return mongoDb.ReadPreference
  }

  static objectId (id) {
    return new mongoDb.ObjectID(id)
  }
}

module.exports = Methods
