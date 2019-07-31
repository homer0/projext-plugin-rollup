const { compression } = require('./compression');
const { copy } = require('./copy');
const { css } = require('./css');
const { devServer } = require('./devServer');
const { extraWatch } = require('./extraWatch');
const { nodeRunner } = require('./nodeRunner');
const { runtimeReplace } = require('./runtimeReplace');
const { stats } = require('./stats');
const { stylesheetAssets } = require('./stylesheetAssets');
const { stylesheetModulesFixer } = require('./stylesheetModulesFixer');
const { template } = require('./template');
const { urls } = require('./urls');
const { windowAsGlobal } = require('./windowAsGlobal');

module.exports = {
  compression,
  copy,
  css,
  devServer,
  extraWatch,
  nodeRunner,
  runtimeReplace,
  stats,
  stylesheetAssets,
  stylesheetModulesFixer,
  template,
  urls,
  windowAsGlobal,
};
