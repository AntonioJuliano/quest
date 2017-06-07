const logger = require('../helpers/logger');
const Consumer = require('sqs-consumer');
const AWS = require('aws-sdk');
const bugsnag = require('../helpers/bugsnag');

/**
 * Queues which can be consumed from
 * @type {Object}
 */
const queues = {
  transaction: {
    name: 'transaction',
    url: process.env.TRANSACTION_QUEUE_URL,
    region: process.env.TRANSACTION_QUEUE_REGION,
    accessKeyId: process.env.TRANSACTION_QUEUE_ID,
    secretAccessKey: process.env.TRANSACTION_QUEUE_KEY,
    numConsumers: parseInt(process.env.TRANSACTION_QUEUE_CONSUMERS)
  },
  task: {
    name: 'task',
    url: process.env.TASK_QUEUE_URL,
    region: process.env.TASK_QUEUE_REGION,
    accessKeyId: process.env.TASK_QUEUE_ID,
    secretAccessKey: process.env.TASK_QUEUE_KEY,
    numConsumers: parseInt(process.env.TASK_QUEUE_CONSUMERS)
  },
}

/**
 * Create consumers to read from a queue. Whenever a message is read from the queue,
 * it will be passed to handler. handler may throw errors, in which case the message will be placed
 * back on the queue, and its retry count incremented. The message will be dropped after a
 * maximum number of retries
 *
 * @param  {Object} queue        Object specifying which queue to consume from. Should be one of
 *                               the queues specified above.
 * @param  {Function} handler    Function called whenever a message is received from the queue.
 *                               Will be called with one argument, the object form of the message
 *                               consumed from the queue. This function may throw errors
 * @param  {Number} numConsumers Optionally specify the number of consumers to create. Higher
 *                               consumer counts will result in increased parallelism
 * @return {boolean}             true on success
 */
function createConsumer(queue, handler) {
  logger.info({
    at: 'consumers#createConsumer',
    message: 'Creating consumer group',
    queue: queue.name,
    numConsumers: queue.numConsumers
  });

  for (let i = 0; i < queue.numConsumers; i++) {
    const app = Consumer.create({
      queueUrl: queue.url,
      handleMessage: async (message, done) => {
        try {
          await handler.handle(JSON.parse(message.Body));
          done();
        } catch (e) {
          bugsnag.notify(e);
          logger.error({
            at: 'consumer#error',
            message: 'Processing message threw error',
            queue: queue.name,
            error: e.toString()
          });
          // This will put the message back on the queue, and increment its retry count
          done(e);
        }
      },
      sqs: new AWS.SQS({
        region: queue.region,
        accessKeyId: queue.accessKeyId,
        secretAccessKey: queue.secretAccessKey
      }),
      batchSize: 10, // 10 is the aws max
      visibilityTimeout: 60 * 5, // 5 minutes
      region: queue.region
    });

    app.on('error', (err) => {
      bugsnag.notify(err);
      logger.error({
        at: 'server#onError',
        message: 'Consumer threw error',
        queue: queue.name,
        error: err.toString()
      });
    });

    app.start();
  }

  return true;
}

module.exports.queues = queues;
module.exports.createConsumer = createConsumer;
