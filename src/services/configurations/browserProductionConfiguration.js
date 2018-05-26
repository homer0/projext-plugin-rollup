const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const replace = require('rollup-plugin-replace');
const sass = require('rollup-plugin-sass');
const html = require('rollup-plugin-html');
const json = require('rollup-plugin-json');
const uglify = require('rollup-plugin-uglify');

const { provider } = require('jimple');
const ConfigurationFile = require('../../abstracts/configurationFile');
const {
  css,
  urls,
  stylesheetAssets,
  template,
  compression,
  stylesheetModulesFixer,
} = require('../../plugins');

class RollupBrowserProductionConfiguration extends ConfigurationFile {
  constructor(
    babelConfiguration,
    events,
    pathUtils,
    rollupPluginSettingsConfiguration
  ) {
    super(pathUtils, 'rollup/browser.production.config.js');

    this.babelConfiguration = babelConfiguration;
    this.events = events;
    this.rollupPluginSettingsConfiguration = rollupPluginSettingsConfiguration;
  }

  createConfig(params) {
    const { target, input, output } = params;
    const pluginSettings = this.rollupPluginSettingsConfiguration.getConfig(params);
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
      uglify(pluginSettings.uglify),
      template(pluginSettings.template),
    ];

    if (!target.library || target.libraryOptions.compress) {
      plugins.push(compression(pluginSettings.compression));
    }

    const config = {
      input,
      output,
      plugins,
    };

    return this.events.reduce(
      'rollup-browser-production-configuration',
      config,
      params
    );
  }
}

const rollupBrowserProductionConfiguration = provider((app) => {
  app.set('rollupBrowserProductionConfiguration', () => new RollupBrowserProductionConfiguration(
    app.get('babelConfiguration'),
    app.get('events'),
    app.get('pathUtils'),
    app.get('rollupPluginSettingsConfiguration')
  ));
});

module.exports = {
  RollupBrowserProductionConfiguration,
  rollupBrowserProductionConfiguration,
};
