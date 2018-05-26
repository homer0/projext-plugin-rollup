const { compression } = require('./compression');
const { css } = require('./css');
const { devServer } = require('./devServer');
const { nodeRunner } = require('./nodeRunner');
const { stylesheetAssets } = require('./stylesheetAssets');
const { stylesheetModulesFixer } = require('./stylesheetModulesFixer');
const { template } = require('./template');
const { urls } = require('./urls');

module.exports = {
  compression,
  css,
  devServer,
  nodeRunner,
  stylesheetAssets,
  stylesheetModulesFixer,
  template,
  urls,
};
