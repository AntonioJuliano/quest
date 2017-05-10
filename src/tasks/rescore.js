const Contract = require('../models/contract');
const logger = require('../helpers/logger');
const contractService = require('../services/contractService');
const contractScorer = require('../lib/contractScorer');

// Increment this if the score algorithm is changed
const SCORE_VERSION = 1;

const rescorers = {
  contract: _rescoreContract
}

function rescore({ address, type, runId, force }) {
  _validate(address, type, runId, force);

  return rescorers[type](address, runId);
}

async function _rescoreContract(address, runId, force) {
  logger.info({
    at: 'rescore#_rescoreContract',
    message: 'Starting contract rescore',
    address: address,
    runId: runId
  });

  const contract = await Contract.findOne({ address: address });

  if (!contract) {
    throw new Error('Could not find contract');
  }

  if (!force && contract.score.lastRescoreId >= runId) {
    logger.info({
      at: 'rescore#_rescoreContract',
      message: 'Contract already rescored',
      address: address,
      runId: runId
    });
    return;
  }

  const txCount = await contractService.getTransactionCount(address);

  const updatedScore = contractScorer.score(contract, txCount);

  contract.score.value = updatedScore;
  contract.score.lastRescoreId = runId;
  contract.score.version = SCORE_VERSION;

  await contract.save();
  await contractService.resetTransactionCount(address);

  logger.info({
    at: 'rescore#_rescoreContract',
    message: 'Finished contract rescore',
    address: address,
    updatedScore: updatedScore,
    runId: runId
  })
}

function _validate(address, type, runId, force) {
  if (!address) {
    throw new Error('address missing');
  }

  if (!type || !rescorers[type]) {
    throw new Error('Invalid type: ' + type);
  }

  if (!runId || typeof runId !== 'number') {
    throw new Error('Invalid runId: ' + runId);
  }

  if (force !== undefined || force !== true || force !== false) {
    throw new Error('Invalid force: ' + force);
  }
}

module.exports = rescore;
