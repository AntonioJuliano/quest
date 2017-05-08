// This needs to be first
require('@risingstack/trace');

const dotenv = require('dotenv');
dotenv.load();

const queueInitializer = require('./consumers/initializer');

queueInitializer.initializeQueues();
