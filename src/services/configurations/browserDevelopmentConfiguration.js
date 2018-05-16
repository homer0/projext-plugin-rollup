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
    const pluginSettings = this.rollupPluginSettingsConfiguration.getConfig(params);
    const plugins = [];

    let server;
    if (target.runOnDevelopment) {
      server = devServer(pluginSettings.devServer);
      plugins.push(server.stop);
    }

    plugins.push(...[
      resolve(pluginSettings.resolve),
      babel(pluginSettings.babel),
      commonjs(pluginSettings.commonjs),
      replace(pluginSettings.replace),
      sass(pluginSettings.sass),
      css(pluginSettings.css),
      stylesheetAssets(pluginSettings.stylesheetAssets),
      html(pluginSettings.html),
      json(pluginSettings.json),
      urls(pluginSettings.urls),
      template(pluginSettings.template),
    ]);

    if (target.runOnDevelopment) {
      plugins.push(server.start);
    }

    const config = {
      input,
      output,
      plugins,
    };

    if (target.runOnDevelopment) {
      config.watch = pluginSettings.watch;
    }

    return this.events.reduce(
      'rollup-browser-development-configuration',
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
