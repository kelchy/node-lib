const swaggerUI = require('swagger-ui-express')
const swaggerJSDoc = require('swagger-jsdoc')

class Swagger {
  static serve () {
    // swaggerUI.serve returns an array
    return swaggerUI.serve
  }

  static setup (doc) {
    const swaggerSpec = Swagger.sampleDoc()
    return swaggerUI.setup(doc || swaggerSpec, { explorer: true })
  }

  static sampleDoc () {
    return swaggerJSDoc({
      definition: {
        openapi: '3.0.3',
        info: {
          title: 'Swagger Title (REPLACE_ME)',
          version: require('../package.json').version,
          description:
            'RESTful API in Express. Defines the routes for the application. (REPLACE_ME)',
          license: {
            name: 'Licensed Under MIT',
            url: 'https://spdx.org/licenses/MIT.html'
          },
          contact: {
            name: 'Kelvin Chua (REPLACE_ME)',
            email: 'kelchy@gmail.com (REPLACE_ME)'
          }
        },
        servers: [
          {
            url: 'http://localhost' // REPLACE_ME
          }
        ]
      },
      apis: ['src/**/*.js'] // REPLACE_ME
    })
  }
}

module.exports = Swagger
