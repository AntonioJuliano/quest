const consumers = require('./consumers');
const transactionHandler = require('../handlers/transactionHandler');
const taskHandler = require('../handlers/taskHandler');

function initializeQueues() {
  consumers.createConsumer(consumers.queues.transaction, transactionHandler);
  consumers.createConsumer(consumers.queues.task, taskHandler);
}

module.exports.initializeQueues = initializeQueues;
