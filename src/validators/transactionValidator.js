const web3 = require('../helpers/web3');

function validate(message) {
  if (!message) {
    throw new Error('Received empty transaction message');
  }
  if (!message.hash) {
    throw new Error('Transaction has no hash');
  }
  if (message.to !== null && message.to && !web3.isAddress(message.to)) {
    throw new Error('Invalid transaction to: ' + message.to + '. Tx hash: ' + message.hash);
  }
}

module.exports.validate = validate;
