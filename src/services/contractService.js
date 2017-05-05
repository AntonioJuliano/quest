const LRU = require("lru-cache");
const web3 = require('../helpers/web3');
const Contract = require('../models/contract');
const logger = require('../helpers/logger');

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

async function createContractIfNotExist(address) {
  const cacheResult = existingContractsCache.get(address);
  if (cacheResult !== undefined) {
    return;
  }

  const existingContract = await Contract.findOne({ address: address }).exec();

  if (existingContract) {
    return;
  }

  const code = await web3.eth.getCodeAsync(address);

  logger.info({
    at: 'contractService#createContractIfNotExist',
    message: 'Creating new contract',
    address: address
  });

  const contract = new Contract({ address: address, code: code });

  await contract.save();
}

module.exports.isContract = isContract;
module.exports.createContractIfNotExist = createContractIfNotExist;
