const validator = require('../validators/transactionValidator');
const logger = require('../helpers/logger');
const contractService = require('../services/contractService');
const redis = require('../helpers/redis');

const REDIS_COUNTER_PREFIX = 'tasked/txCount:';

async function handle(transaction) {
  validator.validate(transaction);

  logger.info({
    at: 'transactionHandler#handle',
    message: 'Processing transaction',
    hash: transaction.hash,
    blockNumber: transaction.blockNumber,
    blockIndex: transaction.transactionIndex
  });

  // If the to field is null, then this is a contract creation transaction
  if (transaction.to === null) {
    // TODO
    return;
  }

  const isToContract = await contractService.isContract(transaction.to, transaction.blockNumber);

  if (isToContract) {
    await contractService.createContractIfNotExist(transaction.to, transaction.blockNumber);
    const count = await redis.incrAsync(REDIS_COUNTER_PREFIX + transaction.to);
    logger.info({
      at: 'transactionHandler#handle',
      message: 'Updated contract tx count',
      address: transaction.to,
      txCount: count
    });
  }

  logger.info({
    at: 'transactionHandler#handle',
    message: 'Finished processing transaction',
    hash: transaction.hash,
    blockNumber: transaction.blockNumber,
    blockIndex: transaction.transactionIndex
  });
}

module.exports.handle = handle;
