const {
  rollupBrowserDevelopmentConfiguration,
} = require('./browserDevelopmentConfiguration');

const {
  rollupBrowserProductionConfiguration,
} = require('./browserProductionConfiguration');

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
  rollupNodeDevelopmentConfiguration,
  rollupNodeProductionConfiguration,
  rollupPluginSettingsConfiguration,
};
