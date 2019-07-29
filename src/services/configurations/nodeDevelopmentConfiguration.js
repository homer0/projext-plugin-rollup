const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const sass = require('rollup-plugin-sass');
const html = require('rollup-plugin-html');
const json = require('rollup-plugin-json');
const polyfill = require('rollup-plugin-polyfill');

const { provider } = require('jimple');
const ConfigurationFile = require('../../abstracts/configurationFile');
const {
  copy,
  css,
  extraWatch,
  nodeRunner,
  runtimeReplace,
  stats,
  stylesheetAssets,
  urls,
} = require('../../plugins');
/**
 * Creates the specifics of a Rollup configuration for a Node target development build.
 * @extends {ConfigurationFile}
 */
class RollupNodeDevelopmentConfiguration extends ConfigurationFile {
  /**
  * @param {Events} events
  * To reduce the configuration.
  * @param {PathUtils} pathUtils
  * Required by `ConfigurationFile` in order to build the path to the overwrite file.
  * @param {RollupPluginSettingsConfiguration} rollupPluginSettingsConfiguration
  * To get the plugin settings.
  */
  constructor(
    events,
    pathUtils,
    rollupPluginSettingsConfiguration
  ) {
    super(pathUtils, [
      'config/rollup/node.development.config.js',
      'config/rollup/node.config.js',
    ]);
    /**
     * A local reference for the `events` service.
     * @type {Events}
     */
    this.events = events;
    /**
     * A local reference for the `rollupPluginSettingsConfiguration` service.
     * @type {RollupPluginSettingsConfiguration}
     */
    this.rollupPluginSettingsConfiguration = rollupPluginSettingsConfiguration;
  }
  /**
   * Creates the complete configuration for a Node target development build.
   * This method uses the reducer events `rollup-node-development-configuration` and
   * `rollup-node-configuration`. It sends the configuration, the received `params` and
   * expects a configuration on return.
   * @param {RollupConfigurationParams} params A dictionary generated by the top service building
   *                                           the configuration and that includes things like the
   *                                           target information, its entry settings, output
   *                                           paths, etc.
   * @return {Object}
   */
  createConfig(params) {
    const {
      definitions,
      input,
      output,
      target,
    } = params;
    // Create the `stats` plugin instance.
    const statsPlugin = stats({
      path: `${target.paths.build}/`,
    });
    // Get the plugins settings.
    const pluginSettings = this.rollupPluginSettingsConfiguration.getConfig(
      params,
      statsPlugin.add
    );
    // Define the plugins list.
    const plugins = [
      statsPlugin.reset(),
      resolve(pluginSettings.resolve),
      commonjs(pluginSettings.commonjs),
      babel(pluginSettings.babel),
      ...(
        pluginSettings.polyfill.length ?
          [polyfill(pluginSettings.polyfill)] :
          []
      ),
      runtimeReplace(definitions),
      extraWatch(pluginSettings.extraWatch),
      sass(pluginSettings.sass),
      css(pluginSettings.css),
      stylesheetAssets.helper(pluginSettings.stylesheetAssetsHelper),
      stylesheetAssets(pluginSettings.stylesheetAssets),
      html(pluginSettings.html),
      json(pluginSettings.json),
      urls(pluginSettings.urls),
      copy(pluginSettings.copy),
      statsPlugin.log(pluginSettings.statsLog),
    ];
    // Get the list of external dependencies.
    const { external } = pluginSettings.external;
    /**
     * Merge the globals settings with any globals that may have been defined on the `output`
     * object by the parent configuration.
     */
    const globals = output.globals ?
      Object.assign({}, output.globals, pluginSettings.globals) :
      pluginSettings.globals;
    // Define the configuration object.
    const config = {
      input,
      output: Object.assign({}, output, { globals }),
      plugins,
      external,
    };
    // If the target should run, add the watch settings and push the runner plugin.
    if (target.runOnDevelopment) {
      config.watch = pluginSettings.watch;
      config.plugins.push(nodeRunner(pluginSettings.nodeRunner));
    } else if (target.watch.development) {
      // If the watch mode is enabled and the target won't run, just add the watch settings.
      config.watch = pluginSettings.watch;
    }
    // Return the reduced configuration.
    return this.events.reduce(
      [
        'rollup-node-development-configuration',
        'rollup-node-configuration',
      ],
      config,
      params
    );
  }
}
/**
 * The service provider that once registered on the app container will set an instance of
 * `RollupNodeDevelopmentConfiguration` as the `rollupNodeDevelopmentConfiguration` service.
 * @example
 * // Register it on the container
 * container.register(rollupNodeDevelopmentConfiguration);
 * // Getting access to the service instance
 * const rollupNodeDevConfig = container.get('rollupNodeDevelopmentConfiguration');
 * @type {Provider}
 */
const rollupNodeDevelopmentConfiguration = provider((app) => {
  app.set('rollupNodeDevelopmentConfiguration', () => new RollupNodeDevelopmentConfiguration(
    app.get('events'),
    app.get('pathUtils'),
    app.get('rollupPluginSettingsConfiguration')
  ));
});

module.exports = {
  RollupNodeDevelopmentConfiguration,
  rollupNodeDevelopmentConfiguration,
};
