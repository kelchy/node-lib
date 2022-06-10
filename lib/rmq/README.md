# RabbitMQ

## This module wraps helper functions around rmq to simplify development

- Requires

```
amqplib
amqp-connection-manager
```

- Basic Initialization - single queue, default options

```
const Rmq = require('@kelchy/rmq')
const rmq = new Rmq(process.env.RMQ_URI, { queue: [{ name: 'queueName' }] })
```

- Custom client options - single queue, custom queue options

```
const options = Rmq.queueOptions({ durable: false }) // this will override default options with durable = false
const rmq = new Rmq(process.env.REDIS_URI, { queue: [{ name: 'queueName', options }] })
```

- Use pubsub - will automatically subscribe to queues

```
const config = {
  queue: [{ name: 'queueName' }],
  exchange: [{ name: 'exchangeName', options: Rmq.exchangeOptions() }],
  bind: [{ exchange: 'exchangeName', queue: 'queueName', type: 'direct' }]
}
const rmq = new Rmq(process.env.RMQ_URI, config, { pubsub: true })
rmq.on('queueName', (msg) => { doSomething() })
```

- Turn internal logging on

```
const Log = require('@kelchy/log')
const rmq = new Rmq(process.env.RMQ_URI, config, { log: new Log.Standard() })
```

- supported methods

```
queueOptions(override)
publishOptions(override)
exchangeOptions(override)
publish(exchange, routing, msg, options)
```
