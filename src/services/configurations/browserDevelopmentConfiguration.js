const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const replace = require('rollup-plugin-replace');
const sass = require('rollup-plugin-sass');
const html = require('rollup-plugin-html');
const json = require('rollup-plugin-json');

const { provider } = require('jimple');
const ConfigurationFile = require('../../abstracts/configurationFile');
const {
  css,
  urls,
  stylesheetAssets,
  template,
  devServer,
  stats,
  stylesheetModulesFixer,
} = require('../../plugins');

class RollupBrowserDevelopmentConfiguration extends ConfigurationFile {
  constructor(
    babelConfiguration,
    events,
    pathUtils,
    rollupPluginSettingsConfiguration
  ) {
    super(pathUtils, 'rollup/browser.development.config.js');

    this.babelConfiguration = babelConfiguration;
    this.events = events;
    this.rollupPluginSettingsConfiguration = rollupPluginSettingsConfiguration;
  }

  createConfig(params) {
    const { input, output, target } = params;
    const statsPlugin = stats({
      path: `${target.paths.build}/`,
    });

    const pluginSettings = this.rollupPluginSettingsConfiguration.getConfig(
      params,
      statsPlugin.add
    );

    const plugins = [
      resolve(pluginSettings.resolve),
      babel(pluginSettings.babel),
      commonjs(pluginSettings.commonjs),
      replace(pluginSettings.replace),
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
      template(pluginSettings.template),
      statsPlugin.log(pluginSettings.statsLog),
    ];

    const { external } = pluginSettings.external;
    const globals = output.globals ?
      Object.assign({}, output.globals, pluginSettings.globals) :
      pluginSettings.globals;

    const config = {
      input,
      output: Object.assign({}, output, { globals }),
      plugins,
      external,
    };

    if (target.runOnDevelopment) {
      config.watch = pluginSettings.watch;
      config.plugins.push(devServer(pluginSettings.devServer));
    }

    return this.events.reduce(
      [
        'rollup-browser-development-configuration',
        'rollup-browser-configuration',
      ],
      config,
      params
    );
  }
}

const rollupBrowserDevelopmentConfiguration = provider((app) => {
  app.set('rollupBrowserDevelopmentConfiguration', () => new RollupBrowserDevelopmentConfiguration(
    app.get('babelConfiguration'),
    app.get('events'),
    app.get('pathUtils'),
    app.get('rollupPluginSettingsConfiguration')
  ));
});

module.exports = {
  RollupBrowserDevelopmentConfiguration,
  rollupBrowserDevelopmentConfiguration,
};
