// This needs to be first
require('@risingstack/trace');

const dotenv = require('dotenv');
dotenv.load();

const transactionConsumer = require('./consumers/transactionConsumer');

transactionConsumer.poll(20);
