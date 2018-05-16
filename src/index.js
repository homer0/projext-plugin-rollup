const { name } = require('../package.json');

const {
  rollupConfiguration,
  rollupBuildEngine,
} = require('./services/building');

const {
  rollupBrowserDevelopmentConfiguration,
  rollupBrowserProductionConfiguration,
  rollupFileRulesConfiguration,
  rollupNodeDevelopmentConfiguration,
  rollupNodeProductionConfiguration,
  rollupPluginSettingsConfiguration,
} = require('./services/configurations');

const loadPlugin = (app) => {
  app.set('rollupPluginInfo', () => ({
    name,
    configuration: 'src/rollup.config.js',
    externals: [
      'express',
      'jimpex',
    ],
  }));

  app.register(rollupConfiguration);
  app.register(rollupBuildEngine);

  app.register(rollupBrowserDevelopmentConfiguration);
  app.register(rollupBrowserProductionConfiguration);
  app.register(rollupFileRulesConfiguration);
  app.register(rollupNodeDevelopmentConfiguration);
  app.register(rollupNodeProductionConfiguration);
  app.register(rollupPluginSettingsConfiguration);
};

module.exports = loadPlugin;
