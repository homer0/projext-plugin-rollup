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
  stats,
  stylesheetAssets,
} = require('../../plugins');

class RollupNodeProductionConfiguration extends ConfigurationFile {
  constructor(
    babelConfiguration,
    events,
    pathUtils,
    rollupPluginSettingsConfiguration
  ) {
    super(pathUtils, 'rollup/node.production.config.js');

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
      stylesheetAssets.helper(pluginSettings.stylesheetAssetsHelper),
      stylesheetAssets(pluginSettings.stylesheetAssets),
      html(pluginSettings.html),
      json(pluginSettings.json),
      urls(pluginSettings.urls),
      statsPlugin.log(pluginSettings.statsLog),
    ];

    const { external } = pluginSettings.external;

    const config = {
      input,
      output,
      plugins,
      external,
    };

    return this.events.reduce(
      'rollup-node-production-configuration',
      config,
      params
    );
  }
}

const rollupNodeProductionConfiguration = provider((app) => {
  app.set('rollupNodeProductionConfiguration', () => new RollupNodeProductionConfiguration(
    app.get('babelConfiguration'),
    app.get('events'),
    app.get('pathUtils'),
    app.get('rollupPluginSettingsConfiguration')
  ));
});

module.exports = {
  RollupNodeProductionConfiguration,
  rollupNodeProductionConfiguration,
};
