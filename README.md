# Node Library

This project aims to create a consolidated collection of **Wrappers** or  **Helper Functions** to reduce the time spent by developers on writing redundant code.
Workspaces are utilized to create module separation where modules are published independently from each other

# RELEASE: How to include in package.json
```
  "dependencies": {
    "@kelchy/common": "^1.0.0",
    "@kelchy/log": "^1.0.0",
    "@kelchy/redis": "^1.0.0",
    "@kelchy/aws": "^1.0.0"
  },
```
# RELEASE: How to use using the scoped projects:
```
const common = require('@kelchy/common')
const Log = require('@kelchy/log')
const Redis = require('@kelchy/redis')
const Aws = require('@kelchy/aws')
```

# DEVELOPMENT: How to include in package.json (warning, this will build all dependencies)
# i.e. if a developer wants to make temporary changes to the modules common, log, redis and aws on local machine while experimenting on the application
# this method will not use the published packages from npm but instead use local copies
```
  "dependencies": {
    "node-lib": "github:kelchy/node-lib#main",
    "@kelchy/common": "file:node_modules/node-lib/lib/common",
    "@kelchy/log": "file:node_modules/node-lib/lib/log",
    "@kelchy/redis": "file:node_modules/node-lib/lib/redis",
    "@kelchy/aws": "file:node_modules/node-lib/lib/aws"
  }
```

## [Modules](lib/README.md)

# Ground Rules
- Pull Request must come from a fork
- Branching:
```
     +-----------------------------+
     |                             |
     |           fork PR -----+    |
     |                        |    |
     |     ---- *feature/ <---+    |
     |     |                  |    |
     |     +---> master <-----+    |
     |             |               |
     |             +----> release  |
     |                             |
     +-----------------------------+
     *no random feature branch prefix

```
- 2 Approvals to merge
- Pull Requests longer than 3 days must have at least 1 approval or else it will be deleted
- Module names should not have any prefix i.e. "cl"
- External dependencies for each module should be bare essentials
- All modules must cater to different use cases
- Each module should have a single owner
- Keep package name of modules as short as possible while keeping context
- Modules are to be properly tagged and versioned
- Use spaces, not tabs. single quotes not double
- Comment heavily
- Max 100 columns and 1000 rows per file - break lines and split files if necessary
- PR without unit test will be rejected
- Lint your code
- Rebase from master
- Close upstream branch after merging
