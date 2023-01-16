const express = require('express')
const cookieParser = require('cookie-parser')
const { json } = require('body-parser')
const bodyParserErrorHandler = require('express-body-parser-error-handler')
const helmet = require('helmet')

const Log = require('@kelchy/log')

const { cors, swagger, ratelimit } = require('./middleware')
const PORT = 3080

class Server {
  constructor (port, option = {}) {
    // if application developer initializes its own logger
    // and pass it to the constructor i.e. they need logging to stdout
    // it should have 3 functions out, debug and error, if not, do nothing
    const log = Log.isValid(option.log) ? option.log : new Log.Empty()
    const {
      cors: corsOpt,
      swagger: swaggerOpt,
      ping: pingOpt,
      limit: limitOpt
    } = option

    const app = express()

    app.disable('x-powered-by')
    app.use(cookieParser())
    app.use(express.urlencoded({ extended: true }))
    app.use(helmet())

    // default application middlewares
    app.use(ratelimit) // already a middleware no need to execute

    if (corsOpt) {
      // cors will only be activated if provided with the option
      app.use(cors(corsOpt.url, corsOpt.domain)) // func returns a valid middleware
    }
    if (swaggerOpt) {
      // only add the route if swagger option provided, else app dev should secure
      // this route behind auth
      app.use('/docs', swagger.serve(), swagger.setup(swaggerOpt.doc))
    }
    if (pingOpt !== false) {
      // app dev has to explicitly turn this off if not wanted
      app.get('/ping', (_req, res) => {
        res.status(200).send('pong')
      })
    }
    const jsonOpt = limitOpt ? { limit: limitOpt } : {}
    app.use(json(jsonOpt), bodyParserErrorHandler())

    const conn = app.listen(
      port || PORT,
      () => log.out('SERVER_INIT', `listening on PORT ${port || PORT}`)
    )
    this.conn = conn
    this.app = app
    this.log = log
  }

  static swaggerDoc () {
    return swagger.sampleDoc()
  }
}

module.exports = Server
