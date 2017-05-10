const repl = require("repl");

const dotenv = require('dotenv');
dotenv.load();

const contractService = require('../services/contractService');
const rescore = require('../tasks/rescore');
const tasks = require('../tasks/tasks');
const Contract = require('../models/contract');

const envName = process.env.NODE_ENV || "dev";
const replServer = repl.start({
  prompt: "triggered (" + envName + ") > "
});

replServer.context.contractService = contractService;
replServer.context.rescore = rescore;
replServer.context.tasks = tasks;
replServer.context.Contract = Contract;
