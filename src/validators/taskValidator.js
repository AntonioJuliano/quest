const tasks = require('../tasks/tasks');

function validate(message) {
  if (!message) {
    throw new Error('Received empty task message');
  }
  if (!message.type) {
    throw new Error('Task has no type');
  }
  if (!tasks[message.type]) {
    throw new Error('Invalid task type: ' + message.type);
  }
  if (!message.args) {
    throw new Error('Task has no args');
  }
}

module.exports.validate = validate;
