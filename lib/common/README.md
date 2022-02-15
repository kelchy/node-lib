# Common

## This module wraps helper functions around host and other miscellaneous functions to simplify development 

- Requires
```
none
```

## misc.js
- Miscellaneous wrappers
- Requires:
```
   fs
   md5 
```
- exported functions:
  - isArray(arg) - return whether arg is array or not
  - isObject(arg) - return whether arg is object or not
  - isInt(arg) - return whether arg is integer or not
  - isEmptyString(arg) - return whether arg is empty string
  - deepCopy(arg) - return a clone of the arg
  - md5Sort(arg) - return hash of a sorted array which is converted from an arg object
  - escapeHtml(arg) - return an html escaped string from arg
  - escapeRegExp(arg) - return a regex escaped string from arg
  - mv(src, dst) - mv a file from src to dst
  - prettifyKBUnit(arg) - from a kb unit, convert to pretty, i.e. 1024 * 1024 = 1GB
  - calculateDistance(lat1, lon1, lat2, lon2) - bounding box computation of long lat distance
  - convertToGb(arg) - convert kb value to gb, 1000 * 1000 = 1
  - uniqify(arg, fields) - return unique array based on specific fields
  - awaitWrap(arg) - return result object from promises with optional timeout
  - getSafeValueFromNestedObject(arg, arr) - safely retrieve values from nested object
  - jsonSafe(arg) - function to parse a json string (JSON.parse) safely
  - error(scope, err) - handle error bubbling, concatenating current scope into the message
  - random(digits, options) - generates cryptographically secure random digits with min/max options

## host.js
- Host level wrappers
- Requires:
```
   os
   net 
```
- exported functions:
  - myName() - return the hostname
  - myAddr(iface) - return the ip address
  - home() - return the home directory
  - isALive(host, port) - detect if the host is alive
  - isIPv4(s) - check if the given string s is a valid IPv4
  - isIPv6(s) - check if the given string s is a valid IPv6
