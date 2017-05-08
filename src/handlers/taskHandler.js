const taskValidator = require('../validators/taskValidator');
const tasks = require('../tasks/tasks');

function handle(task) {
  taskValidator.validate(task);
  return tasks[task.type](task.args);
}

module.exports.handle = handle;
