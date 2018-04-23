const {
  rollupBrowserDevelopmentConfiguration,
} = require('./browserDevelopmentConfiguration');

const {
  rollupBrowserProductionConfiguration,
} = require('./browserProductionConfiguration');

const {
  rollupFileRulesConfiguration,
} = require('./fileRulesConfiguration');

const {
  rollupNodeDevelopmentConfiguration,
} = require('./nodeDevelopmentConfiguration');

const {
  rollupNodeProductionConfiguration,
} = require('./nodeProductionConfiguration');

const {
  rollupPluginSettingsConfiguration,
} = require('./pluginsConfiguration');

module.exports = {
  rollupBrowserDevelopmentConfiguration,
  rollupBrowserProductionConfiguration,
  rollupFileRulesConfiguration,
  rollupNodeDevelopmentConfiguration,
  rollupNodeProductionConfiguration,
  rollupPluginSettingsConfiguration,
};
