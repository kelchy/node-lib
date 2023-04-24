class Logger {
  static logger (self) {
    return (req, res, next) => {
      const start = new Date()
      res.on('finish', () => {
        if (!self.logRequest) {
          return
        }
        if (req.path === self.logSkipPath) {
          return
        }
        const msg = {
          method: req.method,
          status: res.statusCode,
          src: req.ip,
          ms: new Date() - start
        }
        self.log.out(req.path, msg)
      })
      next()
    }
  }
}

module.exports = Logger
