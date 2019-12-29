const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const sass = require('rollup-plugin-sass');
const html = require('rollup-plugin-html');
const json = require('rollup-plugin-json');
const { terser } = require('rollup-plugin-terser');
const visualizer = require('rollup-plugin-visualizer');

const { provider } = require('jimple');
const ConfigurationFile = require('../../abstracts/configurationFile');
const {
  compression,
  copy,
  css,
  extraWatch,
  moduleReplace,
  runtimeReplace,
  stats,
  stylesheetAssets,
  stylesheetModulesFixer,
  template,
  urls,
  windowAsGlobal,
} = require('../../plugins');
/**
 * Creates the specifics of a Rollup configuration for a browser target production build.
 * @extends {ConfigurationFile}
 */
class RollupBrowserProductionConfiguration extends ConfigurationFile {
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
      'config/rollup/browser.production.config.js',
      'config/rollup/browser.config.js',
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
   * Creates the complete configuration for a browser target production build.
   * This method uses the reducer events `rollup-browser-production-configuration` and
   * `rollup-browser-configuration`. It sends the configuration, the received `params` and
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
      analyze,
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
      windowAsGlobal(),
      runtimeReplace(definitions),
      ...(
        pluginSettings.moduleReplace.instructions.length ?
          [moduleReplace(pluginSettings.moduleReplace)] :
          []
      ),
      extraWatch(pluginSettings.extraWatch),
      sass(pluginSettings.sass),
      css(pluginSettings.css),
      stylesheetAssets(pluginSettings.stylesheetAssets),
      ...(
        target.css.modules ?
          [stylesheetModulesFixer(pluginSettings.stylesheetModulesFixer)] :
          []
      ),
      html(pluginSettings.html),
      json(pluginSettings.json),
      urls(pluginSettings.urls),
      ...(
        target.uglifyOnProduction ?
          [terser(pluginSettings.terser)] :
          []
      ),
      copy(pluginSettings.copy),
      ...(
        analyze ?
          [visualizer(pluginSettings.visualizer)] :
          []
      ),
    ];
    // If the target is not a library, push the template plugin for the HTML file.
    if (!target.library) {
      plugins.push(template(pluginSettings.template));
    }
    /**
     * If the target is not a library or has the compression setting enabled, push the plugin
     * to compress the assets using Gzip.
     */
    if (!target.library || target.libraryOptions.compress) {
      plugins.push(compression(pluginSettings.compression));
    }
    // Finally, push the `stats` _"sub plugin"_ to log the report table.
    plugins.push(statsPlugin.log(pluginSettings.statsLog));
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
    // If the watch mode is enabled, add the watch settings.
    if (target.watch.production) {
      config.watch = pluginSettings.watch;
    }
    // Return the reduced configuration.
    return this.events.reduce(
      [
        'rollup-browser-production-configuration',
        'rollup-browser-configuration',
      ],
      config,
      params
    );
  }
}
/**
 * The service provider that once registered on the app container will set an instance of
 * `RollupBrowserProductionConfiguration` as the `rollupBrowserProductionConfiguration` service.
 * @example
 * // Register it on the container
 * container.register(rollupBrowserProductionConfiguration);
 * // Getting access to the service instance
 * const rollupBrowserProdConfig = container.get('rollupBrowserProductionConfiguration');
 * @type {Provider}
 */
const rollupBrowserProductionConfiguration = provider((app) => {
  app.set('rollupBrowserProductionConfiguration', () => new RollupBrowserProductionConfiguration(
    app.get('events'),
    app.get('pathUtils'),
    app.get('rollupPluginSettingsConfiguration')
  ));
});

module.exports = {
  RollupBrowserProductionConfiguration,
  rollupBrowserProductionConfiguration,
};
