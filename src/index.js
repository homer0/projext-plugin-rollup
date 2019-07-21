const { name } = require('../package.json');

const {
  rollupConfiguration,
  rollupBuildEngine,
} = require('./services/building');

const {
  rollupBrowserDevelopmentConfiguration,
  rollupBrowserProductionConfiguration,
  rollupNodeDevelopmentConfiguration,
  rollupNodeProductionConfiguration,
  rollupPluginSettingsConfiguration,
} = require('./services/configurations');

const {
  rollupMiddleware,
} = require('./services/server');
/**
 * This is the method called by projext when loading the plugin. It takes care of registering
 * the Rollup build engine service and all the other services the engine depends on.
 * @param {Projext} app The projext main container.
 * @ignore
 */
const loadPlugin = (app) => {
  /**
   * This define the basic information of the plugin for other services to use:
   * - The name of the plugin.
   * - Where the Rollup configuration file is located.
   * - The subpaths the plugin expose. Since they won't match a dependency on the `package.json`,
   *   a Node target may want to include them while bundling.
   */
  app.set('rollupPluginInfo', () => ({
    name,
    configuration: 'src/rollup.config.js',
    external: [
      'express',
      'jimpex',
    ],
    babelPolyfill: 'polyfill.js',
  }));
  // Register the main services of the build engine.
  app.register(rollupConfiguration);
  app.register(rollupBuildEngine);

  // Register the services for building the targets configurations.
  app.register(rollupBrowserDevelopmentConfiguration);
  app.register(rollupBrowserProductionConfiguration);
  app.register(rollupNodeDevelopmentConfiguration);
  app.register(rollupNodeProductionConfiguration);
  app.register(rollupPluginSettingsConfiguration);

  // Register the service for server integration.
  app.register(rollupMiddleware);
};

module.exports = loadPlugin;
