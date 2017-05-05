const mongoosastic = require("mongoosastic");
const elasticsearch = require('elasticsearch');

const esClient = new elasticsearch.Client({
  host: [
    {
      host: process.env.ELASTICSEARCH_URL,
      protocol: 'http',
      port: process.env.ELASTICSEARCH_PORT
    }
  ]
});

let config = {
  esClient: esClient
};

function plugin(schema, versionNumber, schemaName) {
  config.index = schemaName + '_' + versionNumber;
  schema.plugin(
    mongoosastic,
    config
  );
}

module.exports.plugin = plugin;
