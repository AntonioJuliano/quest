const Contract = require('../models/contract');
const logger = require('../helpers/logger');
const contractService = require('../services/contractService');

// Increment this if the score algorithm is changed
const SCORE_VERSION = 1;

const rescorers = {
  contract: _rescoreContract
}

function rescore({ address, type, runId }) {
  _validate(address, type, runId);

  return rescorers[type](address, runId);
}

async function _rescoreContract(address, runId) {
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

  if (contract.score.lastRescoreId >= runId) {
    logger.info({
      at: 'rescore#_rescoreContract',
      message: 'Contract already rescored',
      address: address,
      runId: runId
    });
    return;
  }

  const txCount = await contractService.getTransactionCount(address);

  const updatedScore = _computeScore(contract, txCount);

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

function _computeScore(contract, txCount) {
  // This score is weighted by a log function when used to rank results
  const oldScore = contract.score.value || 0;
  const newScore = Math.floor(oldScore * .8 + txCount);
  return newScore;
}

function _validate(address, type, runId) {
  if (!address) {
    throw new Error('address missing');
  }

  if (!type || !rescorers[type]) {
    throw new Error('Invalid type: ' + type);
  }

  if (!runId || typeof runId !== 'number') {
    throw new Error('Invalid runId: ' + runId);
  }
}

module.exports = rescore;
