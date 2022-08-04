# Mongo

## This module wraps helper functions around mongodb native connector to simplify development 

- Requires
```
mongodb
```

- Basic Initialization
```
const Mongo = require('@kelchy/mongo')
const mongo = new Mongo(process.env.MONGO_URI)
```
where MONGO_URI looks something like
```
mongodb+srv://<USERNAME>:<PASSWORD>@<HOST>:<PORT>/<DATABASE>?retryWrites=true&w=majority
```
- supported methods and functions
```
readPreference() - returns an object used to set readPreference when initializing the client
objectId(id) - wraps "id" as an objectId used in mongodb _id

class methods:
database(db) - sets the instance to use "db" as the database
admin() - returns methods to perform admin functionality
createCollection(name, options) - creates a collection "name" with an optional "validator"
showCollections() - returns all collections in the current database
find(collection, query, options) - performs a find on "collection" using "query" with options ()
aggregate(collection, query, options) - performs an aggregate on "collection" using "query" with options ()
insert(collection, query, options) - performs an insert on "collection" using "query" with options ()
update(collection, query, operation, options) - performs an update on "collection" using "query" + "operation" with options ()
delete(collection, query, options) - performs a delete on "collection" using "query" with options ()

lock(key, ttl, options) - perform a key-value distributed lock on current database, with optional value
unlock(key, options) - unlock a previous distributed lock
```
