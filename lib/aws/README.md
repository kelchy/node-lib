# AWS

## This module wraps helper functions around aws-sdk to simplify development 

- Requires
```
aws-sdk
```

- Basic Initialization - s3
```
const Aws = require('@kelchy/aws')
const s3 = new Aws.S3(accessKeyId, secretAccessKey)
```
- Custom client options - override region and apiVersion
```
const s3 = new Aws.S3(accessKeyId, secretAccessKey, { region: 'ap-southeast-1', apiVersion: '2006-03-01' })
```

- supported methods
```
async getS3Object(bucket, key, options) - fetch the object denoted by key from specific bucket, returns a buffer (or options.encoding = 'utf8' to convert)
async putS3Object(bucket, key, payload) - upload payload
async delS3Object(bucket, key, options) - delete key, if optional versionId is used, will only delete specific versionId
async listS3ObjectVersions(bucket, prefix) - retrieve all versioning details of key
async listS3Objects(bucket, options) - retrieve list of all keys
```

- Basic Initialization - ses
```
const Aws = require('@kelchy/aws')
const ses = new Aws.SES(accessKeyId, secretAccessKey)
```
- Custom client options - override region and apiVersion
```
const ses = new Aws.SES(accessKeyId, secretAccessKey, { region: 'ap-southeast-1', apiVersion: '2006-03-01' })
```

- supported methods
```
async send(source, destination, options) - send email from source to destination(s) (if array)
                                         - options can have:
                                           - text (if body is text)
                                           - html (if body is html)
                                           - attachments (array of strings pointing to path of file locally stored if with attachments) 
```
