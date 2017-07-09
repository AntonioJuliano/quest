const LRU = require("lru-cache");
const web3 = require('../helpers/web3');
const Contract = require('../models/contract');
const logger = require('../helpers/logger');
const redis = require('../helpers/redis');
const constants = require('../lib/constants');

const IS_CONTRACT_CACHE_SIZE = 100000;
const EXISTING_CONTRACTS_CACHE_SIZE = 100000;
const isContractCache = LRU(IS_CONTRACT_CACHE_SIZE);
const existingContractsCache = LRU(EXISTING_CONTRACTS_CACHE_SIZE);

async function isContract(address) {
  const cacheResult = isContractCache.get(address);
  if (cacheResult !== undefined) {
    return cacheResult;
  }

  const web3Result = await web3.eth.getCodeAsync(address);

  return web3Result && web3Result !== '0x';
}

async function createContractIfNotExist(address, creator, creationTxHash) {
  const cacheResult = existingContractsCache.get(address);
  if (cacheResult !== undefined) {
    return;
  }

  const existingContract = await Contract.findOne({ address: address }).exec();

  if (existingContract) {
    if (existingContract.creator !== creator ||
        existingContract.creationTxHash !== creationTxHash) {
      logger.info({
        at: 'contractService#createContractIfNotExist',
        message: 'Setting creation info on existing contract',
        address: address,
        creator: creator
      });
      existingContract.creator = creator;
      existingContract.creationTxHash = creationTxHash;
      await existingContract.save();
    }
    return;
  }

  const code = await web3.eth.getCodeAsync(address);

  logger.info({
    at: 'contractService#createContractIfNotExist',
    message: 'Creating new contract',
    address: address
  });

  const contract = new Contract({
    address: address,
    code: code,
    creator: creator,
    creationTxHash: creationTxHash
  });

  await contract.save();
}

async function contractCreation(tx) {
  if (tx.to !== null) {
    throw new Error('Not a contract creation transaction');
  }

  const txReceipt = await web3.eth.getTransactionReceiptAsync(tx.hash);

  if (!txReceipt.contractAddress) {
    throw new Error('Receipt did not have contractAddress');
  }

  await createContractIfNotExist(txReceipt.contractAddress, txReceipt.from, tx.hash);
}

function transactionReceived(address) {
  return redis.incrAsync(constants.REDIS_TX_COUNTER_PREFIX + address);
}

async function getTransactionCount(address) {
  const count = await redis.getAsync(constants.REDIS_TX_COUNTER_PREFIX + address);

  return count ? parseInt(count) : 0;
}

function resetTransactionCount(address) {
  return redis.setAsync(constants.REDIS_TX_COUNTER_PREFIX + address, 0);
}

module.exports.isContract = isContract;
module.exports.createContractIfNotExist = createContractIfNotExist;
module.exports.transactionReceived = transactionReceived;
module.exports.getTransactionCount = getTransactionCount;
module.exports.resetTransactionCount = resetTransactionCount;
module.exports.contractCreation = contractCreation;
