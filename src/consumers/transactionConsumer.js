const logger = require('../helpers/logger');
const Consumer = require('sqs-consumer');
const AWS = require('aws-sdk');
const transactionHandler = require('../handlers/transactionHandler');
const bugsnag = require('../helpers/bugsnag');

AWS.config.update({
  region: process.env.TRANSACTION_QUEUE_REGION,
  accessKeyId: process.env.TRANSACTION_QUEUE_ID,
  secretAccessKey: process.env.TRANSACTION_QUEUE_KEY
});

function poll(numConsumers) {
  for (let i = 0; i < numConsumers; i++) {
    const app = Consumer.create({
      queueUrl: process.env.TRANSACTION_QUEUE_URL,
      handleMessage: async (message, done) => {
        try {
          await transactionHandler.handle(JSON.parse(message.Body));
          done();
        } catch (e) {
          logger.error({
            at: 'consumer#error',
            message: 'Processing message threw error',
            error: e.toString()
          });
          // This will put the message back on the queue, and increment its retry count
          done(e);
        }
      },
      sqs: new AWS.SQS(),
      batchSize: 10, // 10 is the aws max
      visibilityTimeout: 60 * 5, // 5 minutes
      region: process.env.TRANSACTION_QUEUE_REGION
    });

    app.on('error', (err) => {
      bugsnag.notify(err);
      logger.error({
        at: 'server#onError',
        message: 'Consumer threw error',
        error: err.toString()
      });
    });

    app.start();
  }
}

module.exports.poll = poll;
