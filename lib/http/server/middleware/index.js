module.exports = {
  logger: require('./logger').logger,
  cors: require('./cors').cors,
  ratelimit: require('./ratelimit').ratelimit,
  swagger: require('./swagger')
}
