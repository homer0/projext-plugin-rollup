const { compression } = require('./compression');
const { css } = require('./css');
const { devServer } = require('./devServer');
const { nodeRunner } = require('./nodeRunner');
const { stats } = require('./stats');
const { stylesheetAssets } = require('./stylesheetAssets');
const { stylesheetModulesFixer } = require('./stylesheetModulesFixer');
const { template } = require('./template');
const { urls } = require('./urls');

module.exports = {
  compression,
  css,
  devServer,
  nodeRunner,
  stats,
  stylesheetAssets,
  stylesheetModulesFixer,
  template,
  urls,
};
