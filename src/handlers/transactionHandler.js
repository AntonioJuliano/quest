const validator = require('../validators/transactionValidator');
const logger = require('../helpers/logger');
const contractService = require('../services/contractService');

async function handle(transaction) {
  validator.validate(transaction);

  logger.info({
    at: 'transactionHandler#handle',
    message: 'Processing transaction',
    hash: transaction.hash,
    blockNumber: transaction.blockNumber,
    blockIndex: transaction.transactionIndex,
    doNotCount: transaction.doNotCount
  });

  // If the to field is null, then this is a contract creation transaction
  if (transaction.to === null) {
    await contractService.contractCreation(transaction);
    return;
  }

  const isToContract = await contractService.isContract(transaction.to, transaction.blockNumber);

  if (isToContract && !transaction.doNotCount) {
    const count = await contractService.transactionReceived(transaction.to);
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
